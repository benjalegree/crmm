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

  // ✅ SOLO FECHA (sin hora)
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

  /* ---------------- Load ---------------- */

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
        maxVal = Math.max(
          maxVal,
          Number(d.calls || 0),
          Number(d.emails || 0),
          Number(d.meetings || 0)
        )
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

  /* ---------------- Render ---------------- */

  return (
    <div style={page}>
      <div style={topRow}>
        <div>
          <h1 style={title}>Dashboard</h1>
          <div style={subtitle}>Welcome back, {getName(user.email)}.</div>
        </div>

        <button type="button" style={btnGhost} onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>

      <div style={grid}>
        <StatCard title="Total leads" value={stats.totalLeads ?? 0} meta="All contacts in your workspace" />
        <StatCard title="Calls today" value={callsToday} meta="Logged calls today" />
        <StatCard title="Emails today" value={emailsToday} meta="Sent / tracked emails" />
        <StatCard title="Meetings today" value={meetingsToday} meta="Booked meetings" />
      </div>

      <div style={bottomGrid}>
        {/* Left: chart */}
        <div style={panel}>
          <div aria-hidden="true" style={sheenTop} />
          <div aria-hidden="true" style={panelGrain} />

          <div style={panelHead}>
            <div>
              <div style={panelTitle}>Weekly activity</div>
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

          <div style={chartWrap}>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart
                  data={weeklyChartData}
                  margin={{ top: 10, right: 14, left: 0, bottom: 0 }}
                  barCategoryGap={14}
                  barGap={6}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.10)"
                    strokeDasharray="0"
                    vertical
                    horizontal
                  />

                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    stroke="rgba(255,255,255,0.55)"
                    style={axisFont}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    stroke="rgba(255,255,255,0.55)"
                    ticks={yTicks}
                    domain={[0, yTicks[yTicks.length - 1] || 10]}
                    style={axisFont}
                  />

                  <Tooltip
                    cursor={false}
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabel}
                    itemStyle={tooltipItem}
                  />

                  {chartFilter === "All" ? (
                    <>
                      <Bar
                        dataKey="calls"
                        name="Calls"
                        fill="url(#pfCalls)"
                        radius={[8, 8, 0, 0]}
                        barSize={10}
                        maxBarSize={12}
                        activeBar={activeBarStyle}
                      />
                      <Bar
                        dataKey="emails"
                        name="Emails"
                        fill="url(#pfEmails)"
                        radius={[8, 8, 0, 0]}
                        barSize={10}
                        maxBarSize={12}
                        activeBar={activeBarStyle}
                      />
                      <Bar
                        dataKey="meetings"
                        name="Meetings"
                        fill="url(#pfMeetings)"
                        radius={[8, 8, 0, 0]}
                        barSize={10}
                        maxBarSize={12}
                        activeBar={activeBarStyle}
                      />
                    </>
                  ) : (
                    <Bar
                      dataKey="value"
                      name={chartFilter}
                      fill="url(#pfSingle)"
                      radius={[8, 8, 0, 0]}
                      barSize={12}
                      maxBarSize={14}
                      activeBar={activeBarStyle}
                    />
                  )}

                  <defs>
                    <linearGradient id="pfCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2BDA9A" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#1FAE7A" stopOpacity={0.95} />
                    </linearGradient>

                    <linearGradient id="pfEmails" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7CF0B4" stopOpacity={0.92} />
                      <stop offset="100%" stopColor="#2BDA9A" stopOpacity={0.92} />
                    </linearGradient>

                    <linearGradient id="pfMeetings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#145C43" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#0B241C" stopOpacity={0.95} />
                    </linearGradient>

                    <linearGradient id="pfSingle" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2BDA9A" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#145C43" stopOpacity={0.95} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: recent activity */}
        <div style={panel}>
          <div aria-hidden="true" style={sheenTop} />
          <div aria-hidden="true" style={panelGrain} />

          <div style={panelHead}>
            <div>
              <div style={panelTitle}>Recent activity</div>
              <div style={panelSub}>Latest logged interactions</div>
            </div>
          </div>

          <div style={activityPanelBody}>
            {!recentActivities.length ? (
              <div style={emptyText}>No activity yet</div>
            ) : (
              <div style={tasksList}>
                {recentActivities.map((a) => {
                  const f = a?.fields || {}
                  const outcome = normalizeOutcome(a) || "Activity"
                  const note = String(f.Notes || "").trim()
                  const contact = getActivityContact(a)
                  const dateOnly = formatDateOnly(f["Activity Date"])

                  return (
                    <div key={a.id} style={taskRow}>
                      <div style={taskLeft}>
                        <div style={taskTopLine}>
                          <div style={taskTypeWrap}>
                            <span style={{ ...taskTypeDot, ...dotByOutcome(outcome) }} />
                            <div style={taskType}>{outcome}</div>
                          </div>

                          <div style={taskDatePill}>{dateOnly}</div>
                        </div>

                        <div style={taskContact}>{contact}</div>
                        <div style={taskNote}>{note || "—"}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, meta }) {
  return (
    <div style={card}>
      <div aria-hidden="true" style={cardSheen} />
      <div aria-hidden="true" style={cardGrain} />

      <div style={cardTop}>
        <div style={cardLabel}>{title}</div>
        <div style={kpiPill}>
          <span style={kpiDot} />
          live
        </div>
      </div>

      <div style={cardValue}>{value}</div>
      <div style={cardSub}>{meta || ""}</div>
    </div>
  )
}

/* ================= STYLES ================= */

const FONT = "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"

const T = {
  ink: "rgba(255,255,255,0.92)",
  ink2: "rgba(255,255,255,0.74)",
  ink3: "rgba(255,255,255,0.56)",
  line: "rgba(255,255,255,0.14)",
  line2: "rgba(255,255,255,0.22)",
  glassA: "rgba(255,255,255,0.12)",
  glassB: "rgba(255,255,255,0.07)",
  accent: "#1FAE7A",
  accent2: "#2BDA9A",
  accentDeep: "#145C43",
  shadow: "0 26px 70px rgba(0,0,0,0.30)"
}

const page = { width: "100%", fontFamily: FONT }

const loadingText = {
  padding: 20,
  fontWeight: 900,
  color: T.ink,
  fontFamily: FONT
}

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 16
}

const title = {
  margin: 0,
  fontSize: 34,
  fontWeight: 950,
  color: T.ink,
  fontFamily: FONT,
  letterSpacing: 0.2
}

const subtitle = {
  marginTop: 6,
  color: T.ink3,
  fontWeight: 750,
  fontFamily: FONT
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 14,
  marginTop: 12
}

const bottomGrid = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 14,
  marginTop: 14,
  alignItems: "stretch"
}

/* ---- Premium glass card ---- */

const card = {
  position: "relative",
  overflow: "hidden",
  background: `linear-gradient(180deg, ${T.glassA}, ${T.glassB})`,
  border: `1px solid ${T.line}`,
  borderRadius: 18,
  padding: 18,
  boxShadow: T.shadow,
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  fontFamily: FONT,
  minHeight: 118
}

const cardSheen = {
  position: "absolute",
  left: -60,
  right: -60,
  top: -70,
  height: 150,
  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
  transform: "rotate(-10deg)",
  opacity: 0.55,
  pointerEvents: "none"
}

const cardGrain = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.10,
  backgroundImage: `
    repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 3px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.018) 0, rgba(0,0,0,0.018) 1px, transparent 1px, transparent 3px)
  `,
  mixBlendMode: "overlay"
}

const cardTop = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
}

const cardLabel = {
  fontSize: 12,
  fontWeight: 950,
  color: "rgba(255,255,255,0.78)",
  textTransform: "uppercase",
  letterSpacing: "0.35px",
  fontFamily: FONT
}

const kpiPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(31,174,122,0.28)",
  background: "rgba(31,174,122,0.10)",
  color: "rgba(255,255,255,0.80)",
  fontWeight: 900,
  fontSize: 11,
  letterSpacing: 0.2,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)"
}

const kpiDot = {
  width: 7,
  height: 7,
  borderRadius: 999,
  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(255,255,255,0) 55%), ${T.accent}`,
  boxShadow: "0 10px 18px rgba(31,174,122,0.22)"
}

const cardValue = {
  position: "relative",
  zIndex: 2,
  marginTop: 10,
  fontSize: 38,
  fontWeight: 980,
  color: T.ink,
  lineHeight: 1.05,
  fontFamily: FONT
}

const cardSub = {
  position: "relative",
  zIndex: 2,
  marginTop: 10,
  fontSize: 12,
  color: T.ink3,
  fontWeight: 750,
  minHeight: 16,
  fontFamily: FONT
}

/* ---- Panels ---- */

const panel = {
  position: "relative",
  overflow: "hidden",
  background: `linear-gradient(180deg, ${T.glassA}, ${T.glassB})`,
  border: `1px solid ${T.line}`,
  borderRadius: 18,
  padding: 18,
  boxShadow: T.shadow,
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  fontFamily: FONT,
  display: "flex",
  flexDirection: "column",
  minHeight: 420
}

const sheenTop = {
  position: "absolute",
  left: -60,
  right: -60,
  top: -70,
  height: 160,
  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
  transform: "rotate(-10deg)",
  opacity: 0.50,
  pointerEvents: "none"
}

const panelGrain = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.10,
  backgroundImage: `
    repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 3px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.018) 0, rgba(0,0,0,0.018) 1px, transparent 1px, transparent 3px)
  `,
  mixBlendMode: "overlay"
}

const panelHead = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap"
}

const panelTitle = {
  fontSize: 13,
  fontWeight: 980,
  color: T.ink,
  fontFamily: FONT
}

const panelSub = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 750,
  color: T.ink3,
  fontFamily: FONT
}

/* ---- Segmented ---- */

const segmented = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  gap: 6,
  padding: 4,
  borderRadius: 14,
  border: `1px solid ${T.line}`,
  background: "rgba(0,0,0,0.18)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)"
}

const segBtn = {
  border: "1px solid transparent",
  background: "transparent",
  padding: "8px 10px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 950,
  fontSize: 12,
  color: "rgba(255,255,255,0.62)",
  fontFamily: FONT,
  transition: "all 140ms ease"
}

const segBtnActive = {
  background: "rgba(31,174,122,0.16)",
  border: "1px solid rgba(31,174,122,0.26)",
  color: "rgba(255,255,255,0.90)",
  boxShadow: "0 12px 26px rgba(0,0,0,0.18)"
}

/* ---- Chart wrap ---- */

const chartWrap = {
  position: "relative",
  zIndex: 2,
  marginTop: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  background: `
    radial-gradient(700px 240px at 50% 0%, rgba(31,174,122,0.10), transparent 60%),
    rgba(0,0,0,0.18)
  `,
  padding: 14
}

const axisFont = {
  fontFamily: FONT,
  fontWeight: 900,
  fontSize: 12
}

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.55)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  color: "rgba(255,255,255,0.92)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.30)",
  fontFamily: FONT
}
const tooltipLabel = { fontWeight: 950, fontFamily: FONT, color: "rgba(255,255,255,0.92)" }
const tooltipItem = { fontWeight: 850, fontFamily: FONT, color: "rgba(255,255,255,0.82)" }

const activeBarStyle = {
  stroke: "rgba(255,255,255,0.85)",
  strokeWidth: 2,
  fillOpacity: 1
}

/* ---- Activity ---- */

const activityPanelBody = {
  position: "relative",
  zIndex: 2,
  marginTop: 14,
  flex: 1,
  minHeight: 320,
  maxHeight: 320,
  overflowY: "auto",
  paddingRight: 6
}

const tasksList = {
  display: "flex",
  flexDirection: "column",
  gap: 10
}

const taskRow = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.18)",
  padding: 12,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)"
}

const taskLeft = { minWidth: 0, flex: 1 }

const taskTopLine = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
}

const taskTypeWrap = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0
}

const taskTypeDot = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: T.accent,
  boxShadow: "0 10px 18px rgba(31,174,122,0.20)"
}

const taskType = {
  fontWeight: 980,
  color: "rgba(255,255,255,0.86)",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.35px"
}

const taskDatePill = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.78)",
  fontWeight: 900,
  fontSize: 11,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)"
}

const taskContact = {
  marginTop: 8,
  fontWeight: 950,
  color: "rgba(255,255,255,0.78)",
  fontSize: 13,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const taskNote = {
  marginTop: 6,
  fontWeight: 750,
  color: "rgba(255,255,255,0.62)",
  fontSize: 13,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const emptyText = {
  marginTop: 12,
  fontWeight: 850,
  color: "rgba(255,255,255,0.62)",
  fontSize: 13,
  fontFamily: FONT
}

/* ---- Buttons / Errors ---- */

const btnGhost = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  fontWeight: 950,
  cursor: "pointer",
  fontSize: 12,
  fontFamily: FONT,
  color: "rgba(255,255,255,0.88)",
  boxShadow: "0 16px 36px rgba(0,0,0,0.22)"
}

const errBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,60,60,0.10)",
  color: "rgba(255,255,255,0.90)",
  border: "1px solid rgba(255,60,60,0.22)",
  fontWeight: 850,
  fontFamily: FONT
}

/* ---- Helpers ---- */

function dotByOutcome(outcome) {
  const o = String(outcome || "").toLowerCase()
  if (o.includes("call")) return { background: "#2BDA9A" }
  if (o.includes("email")) return { background: "#7CF0B4" }
  if (o.includes("meeting")) return { background: "#145C43" }
  if (o.includes("linkedin")) return { background: "#3BE3A2" }
  return { background: "#1FAE7A" }
}
