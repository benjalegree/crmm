import { useEffect, useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts"

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [calendar, setCalendar] = useState(null)
  const [user, setUser] = useState(null)

  const [contactsMap, setContactsMap] = useState({})

  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(true)

  const [chartFilter, setChartFilter] = useState("All")

  /* ---------------- Helpers ---------------- */

  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const safeErrMsg = (data, fallback) =>
    data?.error ||
    data?.details?.error?.message ||
    data?.details?.error ||
    data?.details?.message ||
    fallback

  const toISODate = (d) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  const getName = (email) => {
    if (email === "benjamin.alegre@psicofunnel.com") return "Benjamin"
    if (email === "sarahduatorrss@gmail.com") return "Sarah"
    return "User"
  }

  const normalizeOutcome = (a) => {
    const f = a?.fields || {}
    const raw = (f.Outcome ?? f["Activity Type"] ?? "").toString().trim().toLowerCase()

    if (raw.includes("call")) return "Call"
    if (raw.includes("email")) return "Email"
    if (raw.includes("meeting")) return "Meeting"
    if (raw.includes("linkedin")) return "LinkedIn"
    if (raw.includes("positive")) return "Positive response"
    return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : ""
  }

  const parseDateMs = (val) => {
    const s = String(val || "").trim()
    if (!s) return 0
    const t = new Date(s).getTime()
    if (!Number.isFinite(t)) return 0
    return t
  }

  const formatDateOnly = (val) => {
    const s = String(val || "").trim()
    if (!s) return "—"
    if (s.length >= 10 && s[4] === "-" && s[7] === "-") return s.slice(0, 10)
    const ms = parseDateMs(s)
    if (!ms) return "—"
    return toISODate(new Date(ms))
  }

  const getActivityContact = (a) => {
    const f = a?.fields || {}

    const rel = f["Related Contact"]
    if (Array.isArray(rel) && rel.length) {
      const first = rel[0]
      if (String(first || "").startsWith("rec")) {
        return contactsMap[first] || "Contact"
      }
      const s = String(first || "").trim()
      if (s) return s
    }

    const candidates = [
      f["Contact Name"],
      f["Contact Name..."],
      f["Contact Name (from Related Contact)"],
      f["Related Contact Name"],
      f["Contact"],
      f["Lead"],
      f["Full Name"]
    ]
    for (const c of candidates) {
      if (!c) continue
      if (Array.isArray(c) && c.length) return String(c[0] || "").trim() || "Contact"
      const s = String(c).trim()
      if (s && !s.startsWith("rec")) return s
    }

    return "Contact"
  }

  /* ---------------- Load (ENDPOINTS intactos) ---------------- */

  useEffect(() => {
    let alive = true
    const ctrl = new AbortController()

    const loadAll = async () => {
      setLoading(true)
      setErr("")
      try {
        const [meRes, statsRes, calRes, contactsRes] = await Promise.all([
          fetch("/api/crm?action=me", { credentials: "include", signal: ctrl.signal }),
          fetch("/api/crm?action=getDashboardStats", { credentials: "include", signal: ctrl.signal }),
          fetch("/api/crm?action=getCalendar", { credentials: "include", signal: ctrl.signal }),
          fetch("/api/crm?action=getContacts", { credentials: "include", signal: ctrl.signal })
        ])

        const meData = await readJson(meRes)
        const statsData = await readJson(statsRes)
        const calData = await readJson(calRes)
        const contactsData = await readJson(contactsRes)

        if (!alive) return

        if (!meRes.ok) {
          setErr(safeErrMsg(meData, "Failed to load session"))
          setLoading(false)
          return
        }
        if (!statsRes.ok) {
          setErr(safeErrMsg(statsData, "Failed to load stats"))
          setLoading(false)
          return
        }
        if (!calRes.ok) {
          setErr(safeErrMsg(calData, "Failed to load calendar"))
          setLoading(false)
          return
        }

        const records = contactsRes.ok ? (contactsData?.records || []) : []
        const map = {}
        for (const r of records) {
          const id = r?.id
          const f = r?.fields || {}
          const name =
            f["Full Name"] ||
            `${f["First Name"] || ""} ${f["Last Name"] || ""}`.trim() ||
            f.Name
          if (id && name) map[id] = name
        }

        setContactsMap(map)
        setUser(meData)
        setStats(statsData)
        setCalendar(calData.records || [])
        setLoading(false)
      } catch (e) {
        if (!alive) return
        if (e?.name === "AbortError") return
        setErr("Failed to load dashboard")
        setLoading(false)
      }
    }

    loadAll()

    return () => {
      alive = false
      ctrl.abort()
    }
  }, [])

  /* ---------------- Derived data ---------------- */

  const todayISO = useMemo(() => toISODate(new Date()), [])
  const calendarSafe = calendar || []

  const todayActivities = useMemo(() => {
    return calendarSafe.filter((a) => {
      const raw = a?.fields?.["Activity Date"]
      if (!raw) return false
      return String(raw).slice(0, 10) === todayISO
    })
  }, [calendarSafe, todayISO])

  const callsToday = useMemo(
    () => todayActivities.filter((a) => normalizeOutcome(a) === "Call").length,
    [todayActivities]
  )
  const emailsToday = useMemo(
    () => todayActivities.filter((a) => normalizeOutcome(a) === "Email").length,
    [todayActivities]
  )
  const meetingsToday = useMemo(
    () => todayActivities.filter((a) => normalizeOutcome(a) === "Meeting").length,
    [todayActivities]
  )

  const recentActivities = useMemo(() => {
    const list = [...calendarSafe]
    list.sort((a, b) => {
      const da = parseDateMs(a?.fields?.["Activity Date"])
      const db = parseDateMs(b?.fields?.["Activity Date"])
      return db - da
    })
    return list
  }, [calendarSafe])

  const weeklyChartData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso = toISODate(d)
      const label = d.toLocaleDateString(undefined, { weekday: "short" })

      if (chartFilter === "All") {
        days.push({ iso, name: label, calls: 0, emails: 0, meetings: 0 })
      } else {
        days.push({ iso, name: label, value: 0 })
      }
    }

    const map = new Map(days.map((d) => [d.iso, d]))

    for (const a of calendarSafe) {
      const iso = String(a?.fields?.["Activity Date"] || "").slice(0, 10)
      if (!iso) continue
      const bucket = map.get(iso)
      if (!bucket) continue

      const outcome = normalizeOutcome(a)

      if (chartFilter === "All") {
        if (outcome === "Call") bucket.calls += 1
        if (outcome === "Email") bucket.emails += 1
        if (outcome === "Meeting") bucket.meetings += 1
      } else {
        if (outcome === chartFilter) bucket.value += 1
      }
    }

    return days
  }, [calendarSafe, chartFilter])

  const yTicks = useMemo(() => {
    let maxVal = 0
    if (chartFilter === "All") {
      for (const d of weeklyChartData) {
        maxVal = Math.max(maxVal, Number(d.calls || 0), Number(d.emails || 0), Number(d.meetings || 0))
      }
    } else {
      maxVal = Math.max(0, ...weeklyChartData.map((d) => Number(d.value || 0)))
    }

    const top = Math.max(10, Math.ceil(maxVal / 5) * 5)
    const ticks = []
    for (let t = 0; t <= top; t += 5) ticks.push(t)
    return ticks
  }, [weeklyChartData, chartFilter])

  /* ---------------- UI states ---------------- */

  if (loading) return <div style={U.loading}>Loading…</div>

  if (err) {
    return (
      <div style={U.page}>
        <div style={U.errorCard}>
          <div style={U.errorTitle}>Something went wrong</div>
          <div style={U.errorText}>{err}</div>
          <button type="button" style={U.primaryBtn} onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!stats || !user || !calendar) return <div style={U.loading}>Loading…</div>

  /* ---------------- Render ---------------- */

  return (
    <div style={U.page}>
      <div style={U.header}>
        <div>
          <div style={U.kicker}>Overview</div>
          <h1 style={U.h1}>Dashboard</h1>
          <div style={U.sub}>Welcome back, {getName(user.email)}.</div>
        </div>
        <button type="button" style={U.ghostBtn} onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>

      <div style={U.statsGrid}>
        <StatCard title="Total leads" value={stats.totalLeads ?? 0} variant="solid" />
        <StatCard title="Calls today" value={callsToday} />
        <StatCard title="Emails today" value={emailsToday} />
        <StatCard title="Meetings today" value={meetingsToday} />
      </div>

      <div style={U.grid}>
        <section style={U.panel}>
          <div style={U.panelHead}>
            <div>
              <div style={U.panelTitle}>Weekly activity</div>
              <div style={U.panelSub}>Last 7 days</div>
            </div>

            <div style={U.segmented}>
              {["All", "Call", "Email", "Meeting"].map((k) => {
                const active = chartFilter === k
                return (
                  <button
                    key={k}
                    type="button"
                    style={{ ...U.segBtn, ...(active ? U.segBtnActive : null) }}
                    onClick={() => setChartFilter(k)}
                  >
                    {k}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={U.chartShell}>
            <div style={{ width: "100%", height: 330 }}>
              <ResponsiveContainer>
                <BarChart data={weeklyChartData} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(14,75,57,0.10)" strokeDasharray="0" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="rgba(0,0,0,0.35)" style={U.axisFont} />
                  <YAxis tickLine={false} axisLine={false} stroke="rgba(0,0,0,0.35)" ticks={yTicks} domain={[0, yTicks[yTicks.length - 1] || 10]} style={U.axisFont} />
                  <Tooltip cursor={false} contentStyle={U.tooltip} labelStyle={U.tooltipLabel} itemStyle={U.tooltipItem} />

                  {chartFilter === "All" ? (
                    <>
                      <Bar dataKey="calls" name="Calls" fill="url(#pfCalls)" radius={[12, 12, 0, 0]} barSize={10} />
                      <Bar dataKey="emails" name="Emails" fill="url(#pfEmails)" radius={[12, 12, 0, 0]} barSize={10} />
                      <Bar dataKey="meetings" name="Meetings" fill="url(#pfMeetings)" radius={[12, 12, 0, 0]} barSize={10} />
                    </>
                  ) : (
                    <Bar dataKey="value" name={chartFilter} fill="url(#pfSingle)" radius={[12, 12, 0, 0]} barSize={12} />
                  )}

                  <defs>
                    <linearGradient id="pfCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0E4B39" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#0A3A2C" stopOpacity={0.95} />
                    </linearGradient>
                    <linearGradient id="pfEmails" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22A06B" stopOpacity={0.88} />
                      <stop offset="100%" stopColor="#0E4B39" stopOpacity={0.88} />
                    </linearGradient>
                    <linearGradient id="pfMeetings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0B1511" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#0E4B39" stopOpacity={0.85} />
                    </linearGradient>
                    <linearGradient id="pfSingle" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0E4B39" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#0A3A2C" stopOpacity={0.95} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <aside style={U.panel}>
          <div style={U.panelHead}>
            <div>
              <div style={U.panelTitle}>Recent activity</div>
              <div style={U.panelSub}>Latest logged interactions</div>
            </div>
          </div>

          <div style={U.activityBody}>
            {!recentActivities.length ? (
              <div style={U.empty}>No activity yet</div>
            ) : (
              <div style={U.list}>
                {recentActivities.map((a) => {
                  const f = a?.fields || {}
                  const outcome = normalizeOutcome(a) || "Activity"
                  const note = String(f.Notes || "").trim()
                  const contact = getActivityContact(a)
                  const dateOnly = formatDateOnly(f["Activity Date"])

                  return (
                    <div key={a.id} style={U.row}>
                      <div style={U.rowLeft}>
                        <div style={U.rowTop}>
                          <span style={U.badge}>{outcome}</span>
                          <span style={U.contact}>{contact}</span>
                        </div>
                        <div style={U.note}>{note || "—"}</div>
                      </div>
                      <div style={U.date}>{dateOnly}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function StatCard({ title, value, variant }) {
  return (
    <div style={{ ...U.card, ...(variant === "solid" ? U.cardSolid : null) }}>
      <div style={{ ...U.cardLabel, ...(variant === "solid" ? U.cardLabelSolid : null) }}>{title}</div>
      <div style={{ ...U.cardValue, ...(variant === "solid" ? U.cardValueSolid : null) }}>{value}</div>
      <div style={{ height: 10 }} />
    </div>
  )
}

/* ================= UI THEME ================= */

const GREEN = "#0E4B39"
const GREEN2 = "#0A3A2C"
const INK = "#0B1511"
const MUTED = "rgba(11,21,17,0.58)"
const BORDER = "rgba(14,75,57,0.14)"
const SHADOW = "0 18px 50px rgba(14,75,57,0.14)"
const FONT = "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"

const U = {
  page: { width: "100%", fontFamily: FONT },

  loading: { padding: 20, fontWeight: 950, color: GREEN },

  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    marginBottom: 16
  },

  kicker: { fontSize: 11, fontWeight: 950, letterSpacing: 0.35, textTransform: "uppercase", color: GREEN },
  h1: { margin: "6px 0 0", fontSize: 36, fontWeight: 950, letterSpacing: -0.2, color: INK },
  sub: { marginTop: 8, fontSize: 13, fontWeight: 750, color: MUTED },

  ghostBtn: {
    padding: "12px 14px",
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: "#fff",
    fontWeight: 950,
    cursor: "pointer",
    fontSize: 12,
    boxShadow: "0 12px 26px rgba(14,75,57,0.10)"
  },

  primaryBtn: {
    padding: "12px 14px",
    borderRadius: 18,
    border: "1px solid rgba(0,0,0,0.06)",
    background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN2} 100%)`,
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
    fontSize: 12,
    boxShadow: "0 18px 46px rgba(14,75,57,0.22)"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
    marginTop: 8
  },

  card: {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 24,
    padding: 18,
    boxShadow: SHADOW
  },

  cardSolid: {
    background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN2} 100%)`,
    borderColor: "rgba(0,0,0,0.06)",
    boxShadow: "0 22px 54px rgba(14,75,57,0.26)"
  },

  cardLabel: { fontSize: 11, fontWeight: 950, letterSpacing: 0.35, textTransform: "uppercase", color: GREEN },
  cardLabelSolid: { color: "rgba(255,255,255,0.84)" },

  cardValue: { marginTop: 10, fontSize: 38, fontWeight: 950, color: INK, lineHeight: 1.06 },
  cardValueSolid: { color: "#fff" },

  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 14,
    marginTop: 14,
    alignItems: "stretch"
  },

  panel: {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 24,
    padding: 18,
    boxShadow: SHADOW,
    display: "flex",
    flexDirection: "column",
    minHeight: 460
  },

  panelHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap"
  },

  panelTitle: { fontSize: 13, fontWeight: 950, color: INK },
  panelSub: { marginTop: 4, fontSize: 12, fontWeight: 750, color: MUTED },

  segmented: {
    display: "flex",
    gap: 6,
    padding: 4,
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: "rgba(14,75,57,0.06)"
  },

  segBtn: {
    border: "none",
    background: "transparent",
    padding: "10px 12px",
    borderRadius: 16,
    cursor: "pointer",
    fontWeight: 950,
    fontSize: 12,
    color: "rgba(0,0,0,0.64)"
  },

  segBtnActive: {
    background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN2} 100%)`,
    color: "#fff",
    boxShadow: "0 14px 30px rgba(14,75,57,0.20)"
  },

  chartShell: {
    marginTop: 14,
    borderRadius: 20,
    border: `1px solid ${BORDER}`,
    background: "linear-gradient(180deg, rgba(14,75,57,0.06) 0%, rgba(255,255,255,1) 100%)",
    padding: 14
  },

  axisFont: { fontFamily: FONT, fontWeight: 850, fontSize: 12 },

  tooltip: {
    borderRadius: 18,
    border: `1px solid ${BORDER}`,
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(14px)"
  },
  tooltipLabel: { fontWeight: 950, fontFamily: FONT },
  tooltipItem: { fontWeight: 850, fontFamily: FONT },

  activityBody: {
    marginTop: 14,
    flex: 1,
    minHeight: 330,
    maxHeight: 330,
    overflowY: "auto",
    paddingRight: 6
  },

  list: { display: "flex", flexDirection: "column", gap: 10 },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 20,
    border: `1px solid ${BORDER}`,
    background: "rgba(14,75,57,0.05)"
  },

  rowLeft: { minWidth: 0, flex: 1 },

  rowTop: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: 999,
    background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN2} 100%)`,
    color: "#fff",
    fontWeight: 950,
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },

  contact: { fontWeight: 900, fontSize: 12, color: MUTED, whiteSpace: "nowrap" },

  note: {
    marginTop: 8,
    fontWeight: 750,
    color: "rgba(0,0,0,0.78)",
    fontSize: 13,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },

  date: { fontWeight: 900, color: MUTED, fontSize: 12, whiteSpace: "nowrap" },

  empty: { marginTop: 12, fontWeight: 850, color: MUTED, fontSize: 13 },

  errorCard: {
    maxWidth: 520,
    padding: 18,
    borderRadius: 24,
    border: "1px solid rgba(255,0,0,0.18)",
    background: "rgba(255,0,0,0.06)",
    boxShadow: "0 18px 46px rgba(0,0,0,0.10)"
  },
  errorTitle: { fontWeight: 950, color: "#7a1d1d", fontSize: 14 },
  errorText: { marginTop: 8, fontWeight: 800, color: "rgba(122,29,29,0.92)", fontSize: 13 }
}
