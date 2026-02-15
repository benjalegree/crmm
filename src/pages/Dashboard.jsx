import { useEffect, useMemo, useState } from "react"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts"

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [calendar, setCalendar] = useState(null)
  const [user, setUser] = useState(null)

  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(true)

  // -----------------------------
  // Helpers
  // -----------------------------
  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const toISODate = (d) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  const safeErrMsg = (data, fallback) =>
    data?.error ||
    data?.details?.error?.message ||
    data?.details?.error ||
    data?.details?.message ||
    fallback

  const getName = (email) => {
    if (email === "benjamin.alegre@psicofunnel.com") return "Benjamin"
    if (email === "sarahduatorrss@gmail.com") return "Sarah"
    return "User"
  }

  // -----------------------------
  // Load data
  // -----------------------------
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

  // -----------------------------
  // Derived data (hooks SIEMPRE arriba, sin returns antes)
  // -----------------------------
  const todayISO = useMemo(() => toISODate(new Date()), [])
  const calendarSafe = calendar || []

  const todayActivities = useMemo(() => {
    return calendarSafe.filter((a) => {
      const raw = a?.fields?.["Activity Date"]
      if (!raw) return false
      // tu backend guarda date-only "YYYY-MM-DD"
      return String(raw).slice(0, 10) === todayISO
    })
  }, [calendarSafe, todayISO])

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

  const weeklyChartData = useMemo(() => {
    // últimos 7 días incluyendo hoy
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso = toISODate(d)
      days.push({
        iso,
        label: d.toLocaleDateString(undefined, { weekday: "short" }), // Lun/Mar/...
        count: 0
      })
    }

    const map = new Map(days.map((d) => [d.iso, d]))
    for (const a of calendarSafe) {
      const iso = String(a?.fields?.["Activity Date"] || "").slice(0, 10)
      if (!iso) continue
      const bucket = map.get(iso)
      if (bucket) bucket.count += 1
    }

    return days.map(({ label, count }) => ({ name: label, value: count }))
  }, [calendarSafe])

  const productivity = useMemo(() => {
    const n = todayActivities.length
    // 0..5 => 0..100
    const pct = Math.max(0, Math.min(100, Math.round((n / 5) * 100)))
    return pct
  }, [todayActivities.length])

  // -----------------------------
  // UI states
  // -----------------------------
  if (loading) {
    return <div style={loadingText}>Loading...</div>
  }

  if (err) {
    return (
      <div style={page}>
        <div style={errBox}>{err}</div>
        <button
          type="button"
          style={miniBtn}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats || !user || !calendar) {
    return <div style={loadingText}>Loading...</div>
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div style={page}>
      <div style={topRow}>
        <h1 style={greeting}>Good Morning {getName(user.email)}</h1>
        <button type="button" style={miniBtn} onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>

      <div style={grid}>
        <MetricCard
          title="Today Activity"
          value={todayActivities.length}
          sub={`Productivity ${productivity}%`}
          right={
            <div style={progressBar}>
              <div style={{ ...progressFill, width: `${productivity}%` }} />
            </div>
          }
        />

        <MetricCard
          title="Upcoming Follow-ups"
          value={upcoming.length}
          sub={upcoming.length ? `Next: ${String(upcoming[0]?.fields?.["Next Follow-up Date"] || "").slice(0, 10)}` : "No tasks"}
        />

        <MetricCard title="Total Leads" value={stats.totalLeads ?? 0} sub={`Active: ${stats.activeLeads ?? 0}`} />

        <MetricCard title="Meetings Booked" value={stats.meetingsBooked ?? 0} sub={`Win rate: ${stats.winRate ?? 0}%`} />

        <MetricCard title="Closed Won" value={stats.closedWon ?? 0} sub={`Conversion: ${stats.conversionRate ?? 0}%`} />

        <MetricCard title="Leads w/o Follow-up" value={stats.leadsWithoutFollowUp ?? 0} sub={`Avg days w/o contact: ${stats.avgDaysWithoutContact ?? 0}`} />
      </div>

      <div style={bottomGrid}>
        <div style={largeGlass}>
          <div style={sectionHead}>
            <div>
              <div style={cardTitle}>Weekly Activity</div>
              <div style={mutedSmall}>Last 7 days</div>
            </div>
          </div>

          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={weeklyChartData}>
                <XAxis dataKey="name" stroke="#145c43" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ fontWeight: 900 }}
                  formatter={(v) => [v, "Activities"]}
                />
                <Bar dataKey="value" fill="#1e7a57" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={largeGlass}>
          <div style={sectionHead}>
            <div>
              <div style={cardTitle}>Next Follow-ups</div>
              <div style={mutedSmall}>Upcoming tasks</div>
            </div>
          </div>

          {!upcoming.length ? (
            <div style={subText}>No upcoming tasks</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {upcoming.slice(0, 6).map((a) => {
                const f = a.fields || {}
                const when = String(f["Next Follow-up Date"] || "").slice(0, 10)
                const outcome = f.Outcome ?? f["Activity Type"] ?? "Follow-up"
                const note = String(f.Notes || "").trim()

                return (
                  <div key={a.id} style={taskCard}>
                    <div style={taskTop}>
                      <span style={taskBadge}>{outcome}</span>
                      <span style={taskDate}>{when}</span>
                    </div>
                    {note ? <div style={taskNote}>{note}</div> : <div style={taskNoteMuted}>No notes</div>}
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

/* ================= COMPONENTS ================= */

function MetricCard({ title, value, sub, right }) {
  return (
    <div
      style={glassCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)"
        e.currentTarget.style.boxShadow = "0 32px 80px rgba(15,61,46,0.16)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "0 25px 70px rgba(15,61,46,0.12)"
      }}
    >
      <div style={cardTitle}>{title}</div>
      <div style={bigNumber}>{value}</div>
      {sub ? <div style={subText}>{sub}</div> : null}
      {right ? <div style={{ marginTop: 14 }}>{right}</div> : null}
    </div>
  )
}

/* ================= STYLES ================= */

const page = { width: "100%" }

const topRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
  marginBottom: 26
}

const greeting = {
  fontSize: "38px",
  fontWeight: "800",
  color: "#0f3d2e",
  margin: 0
}

const loadingText = { color: "#0f3d2e", padding: 20, fontWeight: 800 }

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
  borderRadius: "30px",
  padding: "28px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 25px 70px rgba(15,61,46,0.12)",
  transition: "transform .18s ease, box-shadow .18s ease"
}

const largeGlass = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  borderRadius: "30px",
  padding: "28px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 25px 70px rgba(15,61,46,0.12)"
}

const sectionHead = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap"
}

const cardTitle = {
  fontSize: "13px",
  fontWeight: "900",
  color: "#1e7a57",
  marginBottom: "10px",
  letterSpacing: "0.2px",
  textTransform: "uppercase"
}

const bigNumber = {
  fontSize: "44px",
  fontWeight: "900",
  color: "#0f3d2e",
  lineHeight: 1
}

const subText = {
  marginTop: 10,
  fontSize: "13px",
  color: "rgba(15,61,46,0.75)",
  fontWeight: 800
}

const mutedSmall = {
  fontSize: 12,
  color: "rgba(0,0,0,0.45)",
  fontWeight: 800
}

const progressBar = {
  height: "10px",
  background: "rgba(0,0,0,0.05)",
  borderRadius: "999px",
  overflow: "hidden",
  border: "1px solid rgba(0,0,0,0.05)"
}

const progressFill = {
  height: "100%",
  background: "linear-gradient(90deg,#145c43,#1e7a57)",
  borderRadius: "999px"
}

const taskCard = {
  padding: 14,
  borderRadius: 18,
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(0,0,0,0.06)"
}

const taskTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12
}

const taskBadge = {
  fontSize: 12,
  fontWeight: 950,
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(20,92,67,0.10)",
  border: "1px solid rgba(20,92,67,0.18)",
  color: "#145c43",
  whiteSpace: "nowrap"
}

const taskDate = {
  fontSize: 12,
  fontWeight: 950,
  color: "rgba(0,0,0,0.55)"
}

const taskNote = {
  marginTop: 10,
  fontSize: 13,
  color: "rgba(0,0,0,0.75)",
  fontWeight: 700,
  lineHeight: 1.35
}

const taskNoteMuted = {
  marginTop: 10,
  fontSize: 13,
  color: "rgba(0,0,0,0.40)",
  fontWeight: 800
}

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(18px)",
  fontWeight: 800
}

const errBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)",
  fontWeight: 800
}

const miniBtn = {
  padding: "10px 12px",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.70)",
  backdropFilter: "blur(18px)",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12
}
