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

  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(true)

  // All | Call | Email | Meeting
  const [chartFilter, setChartFilter] = useState("Call")

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

  // Outcome normalizado (soporta data vieja con Activity Type)
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

  /* ---------------- Load ---------------- */

  useEffect(() => {
    let alive = true
    const ctrl = new AbortController()

    const loadAll = async () => {
      setLoading(true)
      setErr("")
      try {
        const [meRes, statsRes, calRes] = await Promise.all([
          fetch("/api/crm?action=me", { credentials: "include", signal: ctrl.signal }),
          fetch("/api/crm?action=getDashboardStats", { credentials: "include", signal: ctrl.signal }),
          fetch("/api/crm?action=getCalendar", { credentials: "include", signal: ctrl.signal })
        ])

        const meData = await readJson(meRes)
        const statsData = await readJson(statsRes)
        const calData = await readJson(calRes)

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

  const upcoming = useMemo(() => {
    return calendarSafe
      .filter((a) => {
        const next = a?.fields?.["Next Follow-up Date"]
        if (!next) return false
        return String(next).slice(0, 10) >= todayISO
      })
      .sort((a, b) => {
        const da = new Date(String(a?.fields?.["Next Follow-up Date"] || "")).getTime()
        const db = new Date(String(b?.fields?.["Next Follow-up Date"] || "")).getTime()
        return da - db
      })
  }, [calendarSafe, todayISO])

  // ---------------- Weekly chart data
  // Cuando chartFilter === "All": {calls, emails, meetings}
  // Si no: {value}
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

  // ticks cada 5 (5,10,15,...)
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

    const top = Math.max(5, Math.ceil(maxVal / 5) * 5)
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
        <StatCard
          title="Upcoming follow-ups"
          value={upcoming.length}
          sub={
            upcoming.length
              ? `Next: ${String(upcoming[0]?.fields?.["Next Follow-up Date"] || "").slice(0, 10)}`
              : "—"
          }
        />
        <StatCard title="Calls today" value={callsToday} />
        <StatCard title="Emails today" value={emailsToday} />
        <StatCard title="Meetings today" value={meetingsToday} />
      </div>

      <div style={bottomGrid}>
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

          {/* 👇 Fondo cuadriculado + hover solo en barra (cursor=false) */}
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
                    domain={[0, yTicks[yTicks.length - 1] || 5]}
                    style={axisFont}
                  />

                  <Tooltip
                    cursor={false} // ✅ NO sombrea el cuadrado
                    contentStyle={tooltipStyle}
                    labelStyle={{
                      fontWeight: 900,
                      fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
                    }}
                    itemStyle={{
                      fontWeight: 800,
                      fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
                    }}
                  />

                  {/* ALL = 3 barras por día */}
                  {chartFilter === "All" ? (
                    <>
                      <Bar
                        dataKey="calls"
                        name="Calls"
                        fill="url(#pfCalls)"
                        radius={[6, 6, 0, 0]}
                        barSize={8} // 👈 delgado
                        maxBarSize={10}
                        activeBar={activeBarStyle}
                      />
                      <Bar
                        dataKey="emails"
                        name="Emails"
                        fill="url(#pfEmails)"
                        radius={[6, 6, 0, 0]}
                        barSize={8}
                        maxBarSize={10}
                        activeBar={activeBarStyle}
                      />
                      <Bar
                        dataKey="meetings"
                        name="Meetings"
                        fill="url(#pfMeetings)"
                        radius={[6, 6, 0, 0]}
                        barSize={8}
                        maxBarSize={10}
                        activeBar={activeBarStyle}
                      />
                    </>
                  ) : (
                    /* Filtro individual = 1 barra */
                    <Bar
                      dataKey="value"
                      name={chartFilter}
                      fill="url(#pfSingle)"
                      radius={[6, 6, 0, 0]}
                      barSize={10}
                      maxBarSize={12}
                      activeBar={activeBarStyle}
                    />
                  )}

                  <defs>
                    {/* Tonalidades como en tu referencia: mismo “mood” verde con variaciones */}
                    <linearGradient id="pfCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2aa06e" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#1f7a57" stopOpacity={0.95} />
                    </linearGradient>

                    <linearGradient id="pfEmails" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7bcf8f" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#3aa86e" stopOpacity={0.95} />
                    </linearGradient>

                    <linearGradient id="pfMeetings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#155c44" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#0f3d2e" stopOpacity={0.95} />
                    </linearGradient>

                    <linearGradient id="pfSingle" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1f7a57" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#145c43" stopOpacity={0.95} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={panel}>
          <div style={panelHead}>
            <div>
              <div style={panelTitle}>Next follow-ups</div>
              <div style={panelSub}>Upcoming tasks</div>
            </div>
          </div>

          {!upcoming.length ? (
            <div style={emptyText}>No upcoming tasks</div>
          ) : (
            <div style={tasksList}>
              {upcoming.slice(0, 6).map((a) => {
                const f = a.fields || {}
                const when = String(f["Next Follow-up Date"] || "").slice(0, 10)
                const outcome = normalizeOutcome(a) || "Follow-up"
                const note = String(f.Notes || "").trim()

                return (
                  <div key={a.id} style={taskRow}>
                    <div style={taskLeft}>
                      <div style={taskType}>{outcome}</div>
                      <div style={taskNote}>{note || "—"}</div>
                    </div>
                    <div style={taskDate}>{when}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Components ---------------- */

function StatCard({ title, value, sub }) {
  return (
    <div style={card}>
      <div style={cardLabel}>{title}</div>
      <div style={cardValue}>{value}</div>
      {sub ? <div style={cardSub}>{sub}</div> : <div style={cardSub}> </div>}
    </div>
  )
}

/* ================= STYLES ================= */

const page = { width: "100%" }

const loadingText = {
  padding: 20,
  fontWeight: 800,
  color: "#0f3d2e",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
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
  fontWeight: 900,
  color: "#0f3d2e",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const subtitle = {
  marginTop: 6,
  color: "rgba(0,0,0,0.55)",
  fontWeight: 700,
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 14,
  marginTop: 14
}

const bottomGrid = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 14,
  marginTop: 14
}

const card = {
  background: "rgba(255,255,255,0.60)",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 14,
  padding: 18,
  boxShadow: "0 10px 30px rgba(15,61,46,0.08)"
}

const cardLabel = {
  fontSize: 12,
  fontWeight: 900,
  color: "rgba(20,92,67,0.85)",
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const cardValue = {
  marginTop: 10,
  fontSize: 36,
  fontWeight: 950,
  color: "#0f3d2e",
  lineHeight: 1.1,
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const cardSub = {
  marginTop: 10,
  fontSize: 12,
  color: "rgba(0,0,0,0.55)",
  fontWeight: 700,
  minHeight: 16,
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const panel = {
  background: "rgba(255,255,255,0.60)",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 14,
  padding: 18,
  boxShadow: "0 10px 30px rgba(15,61,46,0.08)"
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
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const panelSub = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 700,
  color: "rgba(0,0,0,0.50)",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const segmented = {
  display: "flex",
  gap: 6,
  padding: 4,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.70)"
}

const segBtn = {
  border: "none",
  background: "transparent",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12,
  color: "rgba(0,0,0,0.60)",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const segBtnActive = {
  background: "rgba(20,92,67,0.12)",
  color: "#145c43"
}

const chartWrap = {
  marginTop: 14,
  borderRadius: 14,
  border: "1px solid rgba(15,61,46,0.10)",
  background: `
    repeating-linear-gradient(
      0deg,
      rgba(15,61,46,0.045) 0px,
      rgba(15,61,46,0.045) 1px,
      transparent 1px,
      transparent 18px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(15,61,46,0.035) 0px,
      rgba(15,61,46,0.035) 1px,
      transparent 1px,
      transparent 18px
    ),
    rgba(255,255,255,0.55)
  `,
  padding: 14
}

const axisFont = {
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif",
  fontWeight: 800,
  fontSize: 12
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(12px)"
}

// ✅ Hover: solo brilla la barra (sin sombrear el cuadro)
const activeBarStyle = {
  stroke: "rgba(255,255,255,0.95)",
  strokeWidth: 2,
  fillOpacity: 1
}

const tasksList = { display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }

const taskRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.70)"
}

const taskLeft = { minWidth: 0, flex: 1 }

const taskType = {
  fontWeight: 950,
  color: "#0f3d2e",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const taskNote = {
  marginTop: 6,
  fontWeight: 700,
  color: "rgba(0,0,0,0.70)",
  fontSize: 13,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const taskDate = {
  fontWeight: 900,
  color: "rgba(0,0,0,0.55)",
  fontSize: 12,
  whiteSpace: "nowrap",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const emptyText = {
  marginTop: 12,
  fontWeight: 800,
  color: "rgba(0,0,0,0.55)",
  fontSize: 13,
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const btnGhost = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.70)",
  backdropFilter: "blur(14px)",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const errBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 12,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)",
  fontWeight: 800,
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}
