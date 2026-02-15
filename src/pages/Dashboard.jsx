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

        const me = await safeJson(meRes)
        const st = await safeJson(statsRes)
        const cal = await safeJson(calRes)

        if (cancelled) return

        if (!meRes.ok) throw new Error(me?.error || "Failed to load session")
        if (!statsRes.ok) throw new Error(st?.error || "Failed to load stats")
        if (!calRes.ok) throw new Error(cal?.error || "Failed to load calendar")

        setUser(me)
        setStats(st)
        setCalendar(cal.records || [])
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
        <button
          style={btn}
          type="button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats || !calendar || !user) {
    return <div style={{ color: "#0f3d2e" }}>Loading...</div>
  }

  const todayStr = toISODate(new Date())

  // ====== normalize calendar rows
  const normalized = useMemo(() => {
    return (calendar || [])
      .map((r) => {
        const f = r?.fields || {}
        const activityDate = toISODate(parseAnyDate(f["Activity Date"]))
        const nfu = f["Next Follow-up Date"] ? toISODate(parseAnyDate(f["Next Follow-up Date"])) : ""
        const outcome = f.Outcome ?? f["Activity Type"] ?? ""
        return {
          id: r.id,
          outcome: String(outcome || ""),
          activityDate,
          nextFollowUp: nfu,
          notes: String(f.Notes || "")
        }
      })
      .filter((x) => x.activityDate) // needs date
  }, [calendar])

  const todayActivities = useMemo(() => {
    return normalized.filter((a) => a.activityDate === todayStr)
  }, [normalized, todayStr])

  const upcoming = useMemo(() => {
    return normalized
      .filter((a) => a.nextFollowUp && a.nextFollowUp >= todayStr)
      .sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp))
  }, [normalized, todayStr])

  // ====== weekly chart (last 7 days)
  const weeklyData = useMemo(() => {
    const days = lastNDays(7).map((d) => toISODate(d))
    const countsByDay = new Map(days.map((d) => [d, 0]))

    for (const a of normalized) {
      if (countsByDay.has(a.activityDate)) {
        countsByDay.set(a.activityDate, (countsByDay.get(a.activityDate) || 0) + 1)
      }
    }

    return days.map((iso) => ({
      day: formatDayShort(iso),
      iso,
      activities: countsByDay.get(iso) || 0
    }))
  }, [normalized])

  // ====== breakdown chart (type/outcome) for current week
  const breakdownData = useMemo(() => {
    const start = startOfDay(new Date())
    const weekStart = new Date(start)
    weekStart.setDate(weekStart.getDate() - 6)
    const weekStartISO = toISODate(weekStart)

    const bucket = new Map()
    for (const a of normalized) {
      if (a.activityDate >= weekStartISO) {
        const key = normalizeOutcome(a.outcome)
        bucket.set(key, (bucket.get(key) || 0) + 1)
      }
    }

    const order = ["Call", "Email", "LinkedIn", "Meeting", "Positive response", "Other"]
    return order
      .map((name) => ({ name, value: bucket.get(name) || 0 }))
      .filter((x) => x.value > 0 || order.length <= 3)
  }, [normalized])

  const name = getName(user?.email)

  const productivity = Math.min(100, todayActivities.length * 20)

  return (
    <div style={page}>
      <div style={topRow}>
        <div>
          <h1 style={greeting}>Good Morning {name}</h1>
          <div style={subtle}>Here’s your activity and follow-ups for this week.</div>
        </div>

        <button
          type="button"
          style={ghostBtn}
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>

      {/* KPI CARDS */}
      <div style={grid}>
        <KpiCard
          title="Today Activity"
          value={todayActivities.length}
          footer={
            <div style={progressBar}>
              <div style={{ ...progressFill, width: `${productivity}%` }} />
            </div>
          }
        />

        <KpiCard
          title="Upcoming Follow-ups"
          value={upcoming.length}
          footer={<div style={miniHint}>From today onward</div>}
        />

        <KpiCard
          title="Total Leads"
          value={stats.totalLeads ?? 0}
          footer={
            <div style={miniHint}>
              Active: <b>{stats.activeLeads ?? 0}</b> · Won: <b>{stats.closedWon ?? 0}</b>
            </div>
          }
        />

        <KpiCard
          title="Conversion"
          value={`${stats.conversionRate ?? 0}%`}
          footer={
            <div style={miniHint}>
              Win rate: <b>{stats.winRate ?? 0}%</b>
            </div>
          }
        />
      </div>

      {/* CHARTS + TASKS */}
      <div style={bottomGrid}>
        <div style={largeGlass}>
          <div style={cardHead}>
            <div>
              <div style={cardTitle}>Weekly Activity</div>
              <div style={cardSubtitle}>Last 7 days · total {weeklyData.reduce((a, b) => a + b.activities, 0)}</div>
            </div>
            <div style={pillRow}>
              <span style={pillChip}>Bars = activities/day</span>
            </div>
          </div>

          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 6" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="day" stroke="rgba(15,61,46,0.65)" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="rgba(15,61,46,0.45)" tickLine={false} axisLine={false} />
                <Tooltip content={<NiceTooltip />} />
                <Bar dataKey="activities" fill="#1e7a57" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Small breakdown */}
          <div style={splitRow}>
            <div style={miniChartWrap}>
              <div style={miniTitle}>This week by type</div>
              <div style={{ width: "100%", height: 190 }}>
                <ResponsiveContainer>
                  <BarChart data={breakdownData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 6" stroke="rgba(0,0,0,0.08)" />
                    <XAxis dataKey="name" stroke="rgba(15,61,46,0.65)" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} stroke="rgba(15,61,46,0.45)" tickLine={false} axisLine={false} />
                    <Tooltip content={<NiceTooltip />} />
                    <Bar dataKey="value" fill="#145c43" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={miniStats}>
              <div style={miniTitle}>Risk</div>
              <div style={miniLine}>
                At risk (7+ days): <b>{stats.atRiskLeads ?? 0}</b>
              </div>
              <div style={miniLine}>
                Cooling (5–6 days): <b>{stats.coolingLeads ?? 0}</b>
              </div>
              <div style={miniLine}>
                No follow-up set: <b>{stats.leadsWithoutFollowUp ?? 0}</b>
              </div>
              <div style={miniLine}>
                Avg days w/o contact: <b>{stats.avgDaysWithoutContact ?? 0}</b>
              </div>
            </div>
          </div>
        </div>

        <div style={largeGlass}>
          <div style={cardHead}>
            <div>
              <div style={cardTitle}>Next Follow-ups</div>
              <div style={cardSubtitle}>Closest tasks first</div>
            </div>
          </div>

          {upcoming.length === 0 ? (
            <div style={subText}>No upcoming tasks</div>
          ) : (
            <div style={taskList}>
              {upcoming.slice(0, 8).map((a) => (
                <div key={a.id} style={taskItem}>
                  <div style={taskTop}>
                    <span style={taskType}>{a.outcome || "Activity"}</span>
                    <span style={taskDate}>{a.nextFollowUp}</span>
                  </div>
                  {a.notes ? <div style={taskNote}>{a.notes}</div> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ================= Helpers ================= */

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

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function parseAnyDate(v) {
  if (!v) return null
  if (v instanceof Date) return v
  const s = String(v).trim()

  // Airtable can return ISO, sometimes date-only
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d

  // dd/mm/yyyy
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
  const now = startOfDay(new Date())
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    out.push(d)
  }
  return out
}

function formatDayShort(iso) {
  // iso YYYY-MM-DD
  const d = new Date(`${iso}T00:00:00`)
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return days[d.getDay()]
}

/* ================= UI ================= */

function KpiCard({ title, value, footer }) {
  return (
    <div style={glassCard}>
      <div style={cardTitle}>{title}</div>
      <div style={bigNumber}>{value}</div>
      {footer ? <div style={{ marginTop: 14 }}>{footer}</div> : null}
    </div>
  )
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

/* ================= STYLES ================= */

const page = { width: "100%" }

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 30
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
  gridTemplateColumns: "2fr 1fr",
  gap: "22px",
  marginTop: "26px"
}

const glassCard = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  borderRadius: "26px",
  padding: "26px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 20px 60px rgba(15,61,46,0.12)",
  transition: "transform .2s ease, box-shadow .2s ease"
}

const largeGlass = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  borderRadius: "26px",
  padding: "26px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 20px 60px rgba(15,61,46,0.12)"
}

const cardHead = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14
}

const cardTitle = {
  fontSize: "14px",
  fontWeight: "900",
  color: "#1e7a57",
  marginBottom: 6
}

const cardSubtitle = {
  fontSize: 13,
  fontWeight: 800,
  color: "rgba(15,61,46,0.55)"
}

const bigNumber = {
  fontSize: "44px",
  fontWeight: "950",
  color: "#0f3d2e"
}

const subText = {
  fontSize: "14px",
  fontWeight: 800,
  color: "rgba(15,61,46,0.65)"
}

const taskList = { display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }

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

const progressBar = {
  marginTop: "10px",
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

const pillRow = { display: "flex", gap: 10, flexWrap: "wrap" }
const pillChip = {
  fontSize: 12,
  fontWeight: 900,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.55)",
  color: "rgba(0,0,0,0.55)"
}

const splitRow = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr",
  gap: 16,
  marginTop: 16
}

const miniChartWrap = {
  borderRadius: 20,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.55)",
  padding: 14
}

const miniStats = {
  borderRadius: 20,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.55)",
  padding: 14
}

const miniTitle = { fontSize: 12, fontWeight: 950, color: "rgba(15,61,46,0.65)", marginBottom: 10 }
const miniLine = { fontSize: 13, color: "rgba(0,0,0,0.70)", marginTop: 10, fontWeight: 800 }

const tooltipBox = {
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 14px 30px rgba(0,0,0,0.10)"
}
const tooltipLabel = { fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.55)" }
const tooltipValue = { marginTop: 6, fontSize: 18, fontWeight: 950, color: "#0f3d2e" }

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

const btn = {
  marginTop: 12,
  padding: 14,
  borderRadius: 14,
  border: "none",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer"
}

/* Optional responsive tweak (keeps your inline-style approach) */
const _responsiveNote = `
If your Layout has padding, this will look great.
If you want the right column to stack on mobile, keep bottomGrid as-is and adjust in Layout media queries.
`
