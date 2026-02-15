import { useEffect, useMemo, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [calendar, setCalendar] = useState(null)
  const [user, setUser] = useState(null)
  const [contactsMap, setContactsMap] = useState({})
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(true)
  const [chartFilter, setChartFilter] = useState("All")

  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const safeErrMsg = (data, fallback) =>
    data?.error || data?.details?.error?.message || data?.details?.error || data?.details?.message || fallback

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
      if (String(first || "").startsWith("rec")) return contactsMap[first] || "Contact"
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

        if (!meRes.ok) return fail(safeErrMsg(meData, "Failed to load session"))
        if (!statsRes.ok) return fail(safeErrMsg(statsData, "Failed to load stats"))
        if (!calRes.ok) return fail(safeErrMsg(calData, "Failed to load calendar"))

        const records = contactsRes.ok ? contactsData?.records || [] : []
        const map = {}
        for (const r of records) {
          const id = r?.id
          const f = r?.fields || {}
          const name = f["Full Name"] || `${f["First Name"] || ""} ${f["Last Name"] || ""}`.trim() || f.Name
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
        fail("Failed to load dashboard")
      }

      function fail(msg) {
        setErr(msg)
        setLoading(false)
      }
    }

    loadAll()

    return () => {
      alive = false
      ctrl.abort()
    }
  }, [])

  const todayISO = useMemo(() => toISODate(new Date()), [])
  const calendarSafe = calendar || []

  const todayActivities = useMemo(() => {
    return calendarSafe.filter((a) => {
      const raw = a?.fields?.["Activity Date"]
      if (!raw) return false
      return String(raw).slice(0, 10) === todayISO
    })
  }, [calendarSafe, todayISO])

  const callsToday = useMemo(() => todayActivities.filter((a) => normalizeOutcome(a) === "Call").length, [todayActivities])
  const emailsToday = useMemo(() => todayActivities.filter((a) => normalizeOutcome(a) === "Email").length, [todayActivities])
  const meetingsToday = useMemo(() => todayActivities.filter((a) => normalizeOutcome(a) === "Meeting").length, [todayActivities])

  const recentActivities = useMemo(() => {
    const list = [...calendarSafe]
    list.sort((a, b) => parseDateMs(b?.fields?.["Activity Date"]) - parseDateMs(a?.fields?.["Activity Date"]))
    return list
  }, [calendarSafe])

  const weeklyChartData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso = toISODate(d)
      const label = d.toLocaleDateString(undefined, { weekday: "short" })

      if (chartFilter === "All") days.push({ iso, name: label, calls: 0, emails: 0, meetings: 0 })
      else days.push({ iso, name: label, value: 0 })
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

  if (loading) return <div style={loadingText}>Loading...</div>

  if (err) {
    return (
      <div style={page}>
        <div style={errBox}>{err}</div>
        <button type="button" style={btnGhost} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (!stats || !user || !calendar) return <div style={loadingText}>Loading...</div>

  return (
    <div style={page}>
      {/* Header como la ref (Welcome back + nombre) */}
      <div style={header}>
        <div>
          <div style={welcome}>Welcome back,</div>
          <h1 style={h1}>{getName(user.email)}</h1>
        </div>

        <button type="button" style={btnPrimary} onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>

      {/* KPI row */}
      <div style={kpiRow}>
        <Kpi title="Total leads" value={stats.totalLeads ?? 0} />
        <Kpi title="Calls today" value={callsToday} />
        <Kpi title="Emails today" value={emailsToday} />
        <Kpi title="Meetings today" value={meetingsToday} />
      </div>

      {/* Main grid */}
      <div style={grid}>
        <section style={panelWide}>
          <div style={panelHead}>
            <div>
              <div style={panelTitle}>Hours activity</div>
              <div style={panelSub}>Last 7 days</div>
            </div>

            <div style={segmented}>
              {["All", "Call", "Email", "Meeting"].map((k) => {
                const active = chartFilter === k
                return (
                  <button
                    key={k}
                    type="button"
                    style={{ ...segBtn, ...(active ? segBtnActive : null) }}
                    onClick={() => setChartFilter(k)}
                  >
                    {k}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={chartBox}>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={weeklyChartData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }} barCategoryGap={14} barGap={6}>
                  <CartesianGrid stroke="rgba(15,23,42,0.10)" strokeDasharray="0" vertical horizontal />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="rgba(15,23,42,0.45)" style={axisFont} />
                  <YAxis tickLine={false} axisLine={false} stroke="rgba(15,23,42,0.45)" ticks={yTicks} domain={[0, yTicks[yTicks.length - 1] || 10]} style={axisFont} />
                  <Tooltip cursor={false} contentStyle={tooltipStyle} labelStyle={tooltipLabel} itemStyle={tooltipItem} />

                  {chartFilter === "All" ? (
                    <>
                      <Bar dataKey="calls" name="Calls" fill="url(#b1)" radius={[10, 10, 0, 0]} barSize={12} />
                      <Bar dataKey="emails" name="Emails" fill="url(#b2)" radius={[10, 10, 0, 0]} barSize={12} />
                      <Bar dataKey="meetings" name="Meetings" fill="url(#b3)" radius={[10, 10, 0, 0]} barSize={12} />
                    </>
                  ) : (
                    <Bar dataKey="value" name={chartFilter} fill="url(#b4)" radius={[10, 10, 0, 0]} barSize={14} />
                  )}

                  <defs>
                    <linearGradient id="b1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.95} />
                    </linearGradient>
                    <linearGradient id="b2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#93C5FD" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.95} />
                    </linearGradient>
                    <linearGradient id="b3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A3E635" stopOpacity={0.90} />
                      <stop offset="100%" stopColor="#84CC16" stopOpacity={0.90} />
                    </linearGradient>
                    <linearGradient id="b4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0.95} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <aside style={panelRight}>
          <div style={panelHead}>
            <div>
              <div style={panelTitle}>Notifications</div>
              <div style={panelSub}>Recent activity</div>
            </div>
          </div>

          <div style={listScroll}>
            {!recentActivities.length ? (
              <div style={emptyText}>No activity yet</div>
            ) : (
              <div style={list}>
                {recentActivities.map((a) => {
                  const f = a?.fields || {}
                  const outcome = normalizeOutcome(a) || "Activity"
                  const note = String(f.Notes || "").trim()
                  const contact = getActivityContact(a)
                  const dateOnly = formatDateOnly(f["Activity Date"])

                  return (
                    <div key={a.id} style={row}>
                      <div style={rowTop}>
                        <div style={pillType}>{outcome}</div>
                        <div style={rowDate}>{dateOnly}</div>
                      </div>
                      <div style={rowTitle}>{contact}</div>
                      <div style={rowNote}>{note || "—"}</div>
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

function Kpi({ title, value }) {
  return (
    <div style={kpi}>
      <div style={kpiTitle}>{title}</div>
      <div style={kpiValue}>{value}</div>
    </div>
  )
}

/* ================= STYLES ================= */

const FONT = "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"

const page = {
  height: "100%",
  width: "100%",
  padding: 18,
  boxSizing: "border-box",
  overflow: "auto",
  fontFamily: FONT
}

const loadingText = { padding: 20, fontWeight: 950, color: "rgba(15,23,42,0.85)" }

const header = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
  padding: "10px 12px 0"
}

const welcome = {
  fontWeight: 800,
  color: "rgba(15,23,42,0.55)",
  fontSize: 13
}

const h1 = {
  margin: "6px 0 0",
  fontSize: 34,
  fontWeight: 980,
  letterSpacing: 0.2,
  color: "#0f172a"
}

const kpiRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 12,
  marginTop: 14,
  padding: "0 12px"
}

/* KPI cards */
const kpi = {
  borderRadius: 18,
  background: "rgba(255,255,255,0.84)",
  border: "1px solid rgba(15,23,42,0.08)",
  boxShadow: "0 18px 50px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.70)",
  padding: 16
}

const kpiTitle = {
  fontWeight: 900,
  fontSize: 12,
  color: "rgba(15,23,42,0.55)",
  textTransform: "uppercase",
  letterSpacing: 0.35
}

const kpiValue = {
  marginTop: 10,
  fontWeight: 980,
  fontSize: 36,
  color: "#0f172a",
  lineHeight: 1.05
}

const grid = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 12,
  marginTop: 12,
  padding: "0 12px 12px"
}

/* Panels */
const panelBase = {
  borderRadius: 22,
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(15,23,42,0.08)",
  boxShadow: "0 22px 70px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.70)",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  minHeight: 420
}

const panelWide = { ...panelBase }
const panelRight = { ...panelBase }

const panelHead = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap"
}

const panelTitle = {
  fontWeight: 980,
  color: "#0f172a",
  fontSize: 14
}

const panelSub = {
  marginTop: 4,
  fontWeight: 750,
  color: "rgba(15,23,42,0.55)",
  fontSize: 12
}

/* segmented */
const segmented = {
  display: "flex",
  gap: 6,
  padding: 4,
  borderRadius: 999,
  background: "rgba(15,23,42,0.04)",
  border: "1px solid rgba(15,23,42,0.08)"
}

const segBtn = {
  border: "1px solid transparent",
  background: "transparent",
  padding: "8px 10px",
  borderRadius: 999,
  cursor: "pointer",
  fontWeight: 950,
  fontSize: 12,
  color: "rgba(15,23,42,0.60)",
  transition: "all 150ms ease",
  fontFamily: FONT
}

const segBtnActive = {
  background: "rgba(59,130,246,0.14)",
  border: "1px solid rgba(59,130,246,0.18)",
  color: "#0f172a"
}

const chartBox = {
  marginTop: 14,
  borderRadius: 18,
  border: "1px solid rgba(15,23,42,0.08)",
  background: "rgba(241,245,249,0.60)",
  padding: 14
}

const axisFont = { fontFamily: FONT, fontWeight: 900, fontSize: 12 }

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid rgba(15,23,42,0.10)",
  background: "rgba(255,255,255,0.95)",
  boxShadow: "0 18px 50px rgba(15,23,42,0.14)"
}
const tooltipLabel = { fontWeight: 950 }
const tooltipItem = { fontWeight: 850 }

const listScroll = {
  marginTop: 14,
  flex: 1,
  overflowY: "auto",
  paddingRight: 6
}

const list = { display: "flex", flexDirection: "column", gap: 10 }

const row = {
  borderRadius: 18,
  border: "1px solid rgba(15,23,42,0.08)",
  background: "rgba(255,255,255,0.86)",
  boxShadow: "0 14px 36px rgba(15,23,42,0.10)",
  padding: 12
}

const rowTop = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
}

const pillType = {
  fontWeight: 950,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.35,
  color: "#0f172a",
  background: "rgba(59,130,246,0.12)",
  border: "1px solid rgba(59,130,246,0.16)",
  padding: "6px 10px",
  borderRadius: 999
}

const rowDate = {
  fontWeight: 850,
  fontSize: 12,
  color: "rgba(15,23,42,0.55)",
  whiteSpace: "nowrap"
}

const rowTitle = {
  marginTop: 10,
  fontWeight: 950,
  color: "#0f172a",
  fontSize: 13,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const rowNote = {
  marginTop: 6,
  fontWeight: 750,
  color: "rgba(15,23,42,0.62)",
  fontSize: 13,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const emptyText = {
  fontWeight: 850,
  color: "rgba(15,23,42,0.55)",
  fontSize: 13
}

const btnPrimary = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(59,130,246,0.22)",
  background: "rgba(59,130,246,0.16)",
  color: "#0f172a",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 18px 44px rgba(59,130,246,0.16)",
  fontFamily: FONT
}

const btnGhost = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(15,23,42,0.10)",
  background: "rgba(255,255,255,0.78)",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 18px 44px rgba(15,23,42,0.12)",
  fontFamily: FONT
}

const errBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,60,60,0.10)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,60,60,0.18)",
  fontWeight: 850
}
