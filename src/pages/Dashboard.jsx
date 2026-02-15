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

        // si contacts falla, no rompemos
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
        <StatCard title="Total leads" value={stats.totalLeads ?? 0} />
        <StatCard title="Calls today" value={callsToday} />
        <StatCard title="Emails today" value={emailsToday} />
        <StatCard title="Meetings today" value={meetingsToday} />
      </div>

      <div style={bottomGrid}>
        {/* ✅ Izquierda: chart */}
        <div style={panel}>
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
                    stroke="rgba(15,61,46,0.10)"
                    strokeDasharray="0"
                    vertical
                    horizontal
                  />

                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    stroke="rgba(0,0,0,0.35)"
                    style={axisFont}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    stroke="rgba(0,0,0,0.35)"
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
                        barSize={8}
                        maxBarSize={10}
                        activeBar={activeBarStyle}
                      />
                      <Bar
                        dataKey="emails"
                        name="Emails"
                        fill="url(#pfEmails)"
                        radius={[8, 8, 0, 0]}
                        barSize={8}
                        maxBarSize={10}
                        activeBar={activeBarStyle}
                      />
                      <Bar
                        dataKey="meetings"
                        name="Meetings"
                        fill="url(#pfMeetings)"
                        radius={[8, 8, 0, 0]}
                        barSize={8}
                        maxBarSize={10}
                        activeBar={activeBarStyle}
                      />
                    </>
                  ) : (
                    <Bar
                      dataKey="value"
                      name={chartFilter}
                      fill="url(#pfSingle)"
                      radius={[8, 8, 0, 0]}
                      barSize={10}
                      maxBarSize={12}
                      activeBar={activeBarStyle}
                    />
                  )}

                  <defs>
                    <linearGradient id="pfCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2aa06e" stopOpacity={0.92} />
                      <stop offset="100%" stopColor="#1f7a57" stopOpacity={0.92} />
                    </linearGradient>

                    <linearGradient id="pfEmails" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7bcf8f" stopOpacity={0.92} />
                      <stop offset="100%" stopColor="#3aa86e" stopOpacity={0.92} />
                    </linearGradient>

                    <linearGradient id="pfMeetings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#155c44" stopOpacity={0.92} />
                      <stop offset="100%" stopColor="#0f3d2e" stopOpacity={0.92} />
                    </linearGradient>

                    <linearGradient id="pfSingle" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1f7a57" stopOpacity={0.92} />
                      <stop offset="100%" stopColor="#145c43" stopOpacity={0.92} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ✅ Derecha: recent activity */}
        <div style={panel}>
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
                          <div style={taskType}>{outcome}</div>
                          <div style={taskContact}>{contact}</div>
                        </div>
                        <div style={taskNote}>{note || "—"}</div>
                      </div>
                      <div style={taskDate}>{dateOnly}</div>
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

function StatCard({ title, value }) {
  return (
    <div style={card}>
      <div style={cardLabel}>{title}</div>
      <div style={cardValue}>{value}</div>
      <div style={cardSub}> </div>
    </div>
  )
}

/* ================= STYLES ================= */

const FONT = "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"

const page = { width: "100%", fontFamily: FONT }

const loadingText = {
  padding: 20,
  fontWeight: 900,
  color: "#0f3d2e",
  fontFamily: FONT
}

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 18
}

const title = {
  margin: 0,
  fontSize: 34,
  fontWeight: 950,
  color: "#0f3d2e",
  fontFamily: FONT,
  letterSpacing: -0.2
}

const subtitle = {
  marginTop: 6,
  color: "rgba(0,0,0,0.52)",
  fontWeight: 750,
  fontFamily: FONT
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 14,
  marginTop: 14
}

/* ✅ responsive más premium (iPad: 1 columna) */
const bottomGrid = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 14,
  marginTop: 14,
  alignItems: "stretch"
}

/* Tip: si querés 1 columna en iPad, lo hago por JS en Layout o con CSS global.
   Como acá es inline styles, te lo dejo listo para que lo hagamos en Layout luego. */

const card = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid rgba(15,61,46,0.10)",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 14px 40px rgba(15,61,46,0.10)",
  fontFamily: FONT
}

const cardLabel = {
  fontSize: 11,
  fontWeight: 950,
  color: "rgba(20,92,67,0.88)",
  textTransform: "uppercase",
  letterSpacing: "0.35px",
  fontFamily: FONT
}

const cardValue = {
  marginTop: 10,
  fontSize: 36,
  fontWeight: 950,
  color: "#0f3d2e",
  lineHeight: 1.08,
  fontFamily: FONT
}

const cardSub = {
  marginTop: 10,
  fontSize: 12,
  color: "rgba(0,0,0,0.55)",
  fontWeight: 750,
  minHeight: 16,
  fontFamily: FONT
}

const panel = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid rgba(15,61,46,0.10)",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 14px 40px rgba(15,61,46,0.10)",
  fontFamily: FONT,
  display: "flex",
  flexDirection: "column",
  minHeight: 420
}

const panelHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap"
}

const panelTitle = {
  fontSize: 13,
  fontWeight: 950,
  color: "#0f3d2e",
  fontFamily: FONT
}

const panelSub = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 750,
  color: "rgba(0,0,0,0.50)",
  fontFamily: FONT
}

const segmented = {
  display: "flex",
  gap: 6,
  padding: 4,
  borderRadius: 14,
  border: "1px solid rgba(15,61,46,0.10)",
  background: "rgba(255,255,255,0.75)",
  fontFamily: FONT
}

const segBtn = {
  border: "none",
  background: "transparent",
  padding: "8px 10px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 950,
  fontSize: 12,
  color: "rgba(0,0,0,0.58)",
  fontFamily: FONT,
  transition: "background 0.12s ease, color 0.12s ease"
}

const segBtnActive = {
  background: "rgba(20,92,67,0.12)",
  color: "#145c43"
}

const chartWrap = {
  marginTop: 14,
  borderRadius: 16,
  border: "1px solid rgba(15,61,46,0.12)",
  background: `
    linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.54) 100%)
  `,
  padding: 14
}

const axisFont = {
  fontFamily: FONT,
  fontWeight: 850,
  fontSize: 12
}

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid rgba(15,61,46,0.12)",
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(14px)",
  fontFamily: FONT
}

const tooltipLabel = { fontWeight: 950, fontFamily: FONT }
const tooltipItem = { fontWeight: 850, fontFamily: FONT }

const activeBarStyle = {
  stroke: "rgba(255,255,255,0.96)",
  strokeWidth: 2,
  fillOpacity: 1
}

const activityPanelBody = {
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
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(15,61,46,0.10)",
  background: "rgba(255,255,255,0.78)",
  fontFamily: FONT
}

const taskLeft = { minWidth: 0, flex: 1 }

const taskTopLine = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 10
}

const taskType = {
  fontWeight: 950,
  color: "#0f3d2e",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.35px",
  fontFamily: FONT
}

const taskContact = {
  fontWeight: 900,
  color: "rgba(0,0,0,0.58)",
  fontSize: 12,
  whiteSpace: "nowrap",
  fontFamily: FONT
}

const taskNote = {
  marginTop: 6,
  fontWeight: 750,
  color: "rgba(0,0,0,0.72)",
  fontSize: 13,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontFamily: FONT
}

const taskDate = {
  fontWeight: 900,
  color: "rgba(0,0,0,0.55)",
  fontSize: 12,
  whiteSpace: "nowrap",
  fontFamily: FONT
}

const emptyText = {
  marginTop: 12,
  fontWeight: 850,
  color: "rgba(0,0,0,0.55)",
  fontSize: 13,
  fontFamily: FONT
}

const btnGhost = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(15,61,46,0.12)",
  background: "rgba(255,255,255,0.74)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  fontWeight: 950,
  cursor: "pointer",
  fontSize: 12,
  fontFamily: FONT,
  boxShadow: "0 10px 24px rgba(15,61,46,0.08)"
}

const errBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)",
  fontWeight: 850,
  fontFamily: FONT
}
