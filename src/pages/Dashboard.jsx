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
  const [me, setMe] = useState(null)
  const [err, setErr] = useState("")
  const [isNarrow, setIsNarrow] = useState(false)

  // ✅ nunca tocar window fuera del effect
  useEffect(() => {
    const onResize = () => setIsNarrow(typeof window !== "undefined" ? window.innerWidth < 980 : false)
    onResize()
    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize)
      return () => window.removeEventListener("resize", onResize)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        setErr("")

        const [meRes, statsRes, calRes] = await Promise.all([
          fetch("/api/crm?action=me", { credentials: "include" }),
          fetch("/api/crm?action=getDashboardStats", { credentials: "include" }),
          fetch("/api/crm?action=getCalendar", { credentials: "include" })
        ])

        const meData = await safeJson(meRes)
        const statsData = await safeJson(statsRes)
        const calData = await safeJson(calRes)

        if (cancelled) return

        if (!meRes.ok) throw new Error(meData?.error || "Failed to load session")
        if (!statsRes.ok) throw new Error(statsData?.error || "Failed to load stats")
        if (!calRes.ok) throw new Error(calData?.error || "Failed to load calendar")

        setMe(meData) // {authenticated, email}
        setStats(statsData)
        setCalendar(calData.records || [])
      } catch (e) {
        if (cancelled) return
        setErr(String(e?.message || "Failed to load dashboard"))
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  if (err) {
    return (
      <div style={page}>
        <div style={errBox}>{err}</div>
        <button style={ghostBtn} type="button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (!stats || !calendar || !me) {
    return <div style={{ color: "#0f3d2e", fontWeight: 900 }}>Loading...</div>
  }

  const email = me?.email || ""
  const username = getName(email)

  const todayISO = toISODate(new Date())

  // ✅ normalizamos records (evita NaN / undefined)
  const normalized = useMemo(() => {
    const list = (calendar || []).map((r) => {
      const f = r?.fields || {}
      const activityDate = toISODate(parseAnyDate(f["Activity Date"]))
      const nextFU = f["Next Follow-up Date"] ? toISODate(parseAnyDate(f["Next Follow-up Date"])) : ""
      const rawOutcome = f.Outcome ?? f["Activity Type"] ?? ""
      const outcome = normalizeOutcome(rawOutcome)
      const notes = String(f.Notes || f.Notas || f.Observaciones || "")
      return { id: r?.id, activityDate, nextFollowUp: nextFU, outcome, notes }
    })
    return list.filter((x) => x.id && x.activityDate)
  }, [calendar])

  const todayActivities = useMemo(() => {
    return normalized.filter((a) => a.activityDate === todayISO)
  }, [normalized, todayISO])

  const upcoming = useMemo(() => {
    return normalized
      .filter((a) => a.nextFollowUp && a.nextFollowUp >= todayISO)
      .sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp))
  }, [normalized, todayISO])

  // last 7 days bars
  const weeklyData = useMemo(() => {
    const days = lastNDays(7).map((d) => toISODate(d))
    const counts = new Map(days.map((d) => [d, 0]))
    for (const a of normalized) {
      if (counts.has(a.activityDate)) counts.set(a.activityDate, (counts.get(a.activityDate) || 0) + 1)
    }
    return days.map((iso) => ({
      iso,
      day: formatDayShort(iso),
      activities: counts.get(iso) || 0
    }))
  }, [normalized])

  const weeklyTotal = weeklyData.reduce((sum, d) => sum + (d.activities || 0), 0)

  // breakdown week by type/outcome
  const breakdownData = useMemo(() => {
    const days = lastNDays(7).map((d) => toISODate(d))
    const weekStartISO = days[0]

    const bucket = new Map()
    for (const a of normalized) {
      if (a.activityDate >= weekStartISO) {
        bucket.set(a.outcome, (bucket.get(a.outcome) || 0) + 1)
      }
    }

    const order = ["Call", "Email", "LinkedIn", "Meeting", "Positive response", "Other"]
    return order.map((name) => ({ name, value: bucket.get(name) || 0 }))
  }, [normalized])

  const productivity = Math.min(100, todayActivities.length * 20)

  return (
    <div style={page}>
      <div style={topRow}>
        <div>
          <h1 style={greeting}>Good Morning {username}</h1>
          <div style={subtle}>Last 7 days · Total activities: {weeklyTotal}</div>
        </div>

        <button style={ghostBtn} type="button" onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>

      <div style={grid}>
        <div style={glassCard}>
          <div style={cardTitle}>Today Activity</div>
          <div style={bigNumber}>{todayActivities.length}</div>
          <div style={progressBar}>
            <div style={{ ...progressFill, width: `${productivity}%` }} />
          </div>
          <div style={miniHint}>{todayActivities.length >= 5 ? "Great pace" : "Aim for 5 touchpoints"}</div>
        </div>

        <div style={glassCard}>
          <div style={cardTitle}>Upcoming Follow-ups</div>
          <div style={bigNumber}>{upcoming.length}</div>
          <div style={miniHint}>Scheduled from today</div>
        </div>

        <div style={glassCard}>
          <div style={cardTitle}>Total Leads</div>
          <div style={bigNumber}>{stats.totalLeads ?? 0}</div>
          <div style={miniHint}>
            Active: <b>{stats.activeLeads ?? 0}</b> · Won: <b>{stats.closedWon ?? 0}</b>
          </div>
        </div>

        <div style={glassCard}>
          <div style={cardTitle}>Conversion</div>
          <div style={bigNumber}>{String(stats.conversionRate ?? 0)}%</div>
          <div style={miniHint}>
            Win rate: <b>{String(stats.winRate ?? 0)}%</b>
          </div>
        </div>
      </div>

      <div
        style={{
          ...bottomGrid,
          gridTemplateColumns: isNarrow ? "1fr" : "2fr 1fr"
        }}
      >
        <div style={largeGlass}>
          <div style={chartHead}>
            <div>
              <div style={cardTitle}>Weekly Activity</div>
              <div style={chartSub}>Bars = activities/day</div>
            </div>
          </div>

          {/* ✅ Recharts needs explicit height */}
          <div style={{ width: "100%", height: 280 }}>
            <SafeChart>
              <ResponsiveContainer>
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 6" stroke="rgba(0,0,0,0.08)" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="rgba(15,61,46,0.65)" />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="rgba(15,61,46,0.45)" />
                  <Tooltip content={<NiceTooltip />} />
                  <Bar dataKey="activities" fill="#1e7a57" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SafeChart>
          </div>

          <div style={divider} />

          <div style={cardTitle}>This week by type</div>
          <div style={{ width: "100%", height: 220 }}>
            <SafeChart>
              <ResponsiveContainer>
                <BarChart data={breakdownData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 6" stroke="rgba(0,0,0,0.08)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="rgba(15,61,46,0.65)" />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="rgba(15,61,46,0.45)" />
                  <Tooltip content={<NiceTooltip />} />
                  <Bar dataKey="value" fill="#145c43" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SafeChart>
          </div>
        </div>

        <div style={largeGlass}>
          <div style={cardTitle}>Next Follow-ups</div>

          {upcoming.length === 0 ? (
            <div style={subText}>No upcoming tasks</div>
          ) : (
            <div style={taskList}>
              {upcoming.slice(0, 8).map((a) => (
                <div key={a.id} style={taskItem}>
                  <div style={taskTop}>
                    <span style={taskType}>{a.outcome}</span>
                    <span style={taskDate}>{a.nextFollowUp}</span>
                  </div>
                  {a.notes ? <div style={taskNote}>{a.notes}</div> : null}
                </div>
              ))}
            </div>
          )}

          <div style={divider} />

          <div style={cardTitle}>Risk</div>
          <div style={riskLine}>
            At risk (7+ days): <b>{stats.atRiskLeads ?? 0}</b>
          </div>
          <div style={riskLine}>
            Cooling (5–6 days): <b>{stats.coolingLeads ?? 0}</b>
          </div>
          <div style={riskLine}>
            No follow-up set: <b>{stats.leadsWithoutFollowUp ?? 0}</b>
          </div>
          <div style={riskLine}>
            Avg days w/o contact: <b>{stats.avgDaysWithoutContact ?? 0}</b>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================
   Error-proof wrapper (prevents blank screen if Recharts crashes)
========================= */
function SafeChart({ children }) {
  try {
    return children
  } catch {
    return (
      <div style={chartFallback}>
        Chart failed to render (data/size). Refresh or check container height.
      </div>
    )
  }
}

/* =========================
   Helpers
========================= */

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

function getName(email) {
  if (email === "benjamin.alegre@psicofunnel.com") return "Benjamin"
  if (email === "sarahduatorrss@gmail.com") return "Sarah"
  return "User"
}

function normalizeOutcome(v) {
  const s = String(v || "").trim().toLowerCase()
  if (!s) return "Other"
  if (s.includes("call")) return "Call"
  if (s.includes("email")) return "Email"
  if (s.includes("linkedin")) return "LinkedIn"
  if (s.includes("meeting")) return "Meeting"
  if (s.includes("positive")) return "Positive response"
  return "Other"
}

function parseAnyDate(v) {
  if (!v) return null
  if (v instanceof Date) return v
  const s = String(v).trim()
  if (!s) return null

  // date-only YYYY-MM-DD
  if (s.length >= 10 && s[4] === "-" && s[7] === "-") return new Date(`${s.slice(0, 10)}T00:00:00`)

  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d

  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`)

  return null
}

function toISODate(d) {
  if (!d) return ""
  const x = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(x.getTime())) return ""
  const yyyy = x.getFullYear()
  const mm = String(x.getMonth() + 1).padStart(2, "0")
  const dd = String(x.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function lastNDays(n) {
  const out = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    out.push(d)
  }
  return out
}

function formatDayShort(iso) {
  const d = new Date(`${iso}T00:00:00`)
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return days[d.getDay()]
}

function NiceTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const v = payload[0]?.value ?? 0
  return (
    <div style={tooltipBox}>
      <div style={tooltipLabel}>{label}</div>
      <div style={tooltipValue}>{v}</div>
    </div>
  )
}

/* =========================
   Styles
========================= */

const page = { width: "100%" }

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 34
}

const greeting = {
  fontSize: "38px",
  fontWeight: "900",
  color: "#0f3d2e",
  margin: 0
}

const subtle = {
  marginTop: 10,
  fontSize: 14,
  fontWeight: 800,
  color: "rgba(15,61,46,0.55)"
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
  gap: "22px"
}

const bottomGrid = {
  display: "grid",
  gap: "22px",
  marginTop: "26px"
}

const glassCard = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  borderRadius: "26px",
  padding: "26px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 20px 60px rgba(15,61,46,0.12)"
}

const largeGlass = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  borderRadius: "26px",
  padding: "26px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 20px 60px rgba(15,61,46,0.12)"
}

const chartHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10
}

const chartSub = {
  fontSize: 13,
  fontWeight: 800,
  color: "rgba(15,61,46,0.55)"
}

const cardTitle = {
  fontSize: "14px",
  fontWeight: "900",
  color: "#1e7a57",
  marginBottom: "8px"
}

const bigNumber = {
  fontSize: "44px",
  fontWeight: "950",
  color: "#0f3d2e"
}

const miniHint = {
  marginTop: 10,
  fontSize: 12,
  fontWeight: 900,
  color: "rgba(0,0,0,0.50)"
}

const subText = {
  fontSize: "14px",
  fontWeight: 800,
  color: "rgba(15,61,46,0.65)"
}

const progressBar = {
  marginTop: "14px",
  height: "10px",
  background: "rgba(0,0,0,0.06)",
  borderRadius: "999px",
  overflow: "hidden"
}

const progressFill = {
  height: "100%",
  background: "linear-gradient(90deg,#145c43,#1e7a57)",
  borderRadius: "999px",
  transition: "width .35s ease"
}

const taskList = { display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }

const taskItem = {
  padding: 12,
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.65)"
}

const taskTop = { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }
const taskType = { fontWeight: 950, color: "rgba(0,0,0,0.80)", fontSize: 13 }
const taskDate = { fontWeight: 900, color: "rgba(0,0,0,0.55)", fontSize: 12 }
const taskNote = { marginTop: 8, fontSize: 13, color: "rgba(0,0,0,0.70)", lineHeight: 1.35 }

const riskLine = { marginTop: 10, fontSize: 13, color: "rgba(0,0,0,0.70)", fontWeight: 800 }

const divider = { height: 1, background: "rgba(0,0,0,0.06)", margin: "18px 0" }

const tooltipBox = {
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 14px 30px rgba(0,0,0,0.10)"
}
const tooltipLabel = { fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.55)" }
const tooltipValue = { marginTop: 6, fontSize: 18, fontWeight: 950, color: "#0f3d2e" }

const chartFallback = {
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.7)",
  color: "rgba(0,0,0,0.65)",
  fontWeight: 900
}

const ghostBtn = {
  padding: "12px 14px",
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(18px)",
  cursor: "pointer",
  fontWeight: 900
}

const errBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)"
}
