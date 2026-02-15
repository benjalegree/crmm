import { useEffect, useMemo, useState } from "react"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts"

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [calendar, setCalendar] = useState(null)
  const [user, setUser] = useState(null)

  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(true)

  // Filtro del gráfico
  const [chartFilter, setChartFilter] = useState("All") // All | Call | Email | Meeting

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

  const normalizeOutcome = (a) => {
    const f = a?.fields || {}
    const raw = (f.Outcome ?? f["Activity Type"] ?? "").toString().trim().toLowerCase()

    // soporta variantes
    if (raw.includes("call")) return "Call"
    if (raw.includes("email")) return "Email"
    if (raw.includes("meeting")) return "Meeting"
    if (raw.includes("linkedin")) return "LinkedIn"
    if (raw.includes("positive")) return "Positive response"

    // fallback: capitaliza algo
    if (!raw) return ""
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }

  const getName = (email) => {
    if (email === "benjamin.alegre@psicofunnel.com") return "Benjamin"
    if (email === "sarahduatorrss@gmail.com") return "Sarah"
    return "User"
  }

  /* ---------------- Load data ---------------- */

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

  const callsToday = useMemo(() => {
    return todayActivities.filter((a) => normalizeOutcome(a) === "Call").length
  }, [todayActivities])

  const emailsToday = useMemo(() => {
    return todayActivities.filter((a) => normalizeOutcome(a) === "Email").length
  }, [todayActivities])

  const meetingsToday = useMemo(() => {
    return todayActivities.filter((a) => normalizeOutcome(a) === "Meeting").length
  }, [todayActivities])

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

  const filteredForChart = useMemo(() => {
    if (chartFilter === "All") return calendarSafe
    return calendarSafe.filter((a) => normalizeOutcome(a) === chartFilter)
  }, [calendarSafe, chartFilter])

  const weeklyChartData = useMemo(() => {
    // últimos 7 días incluyendo hoy
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const iso = toISODate(d)
      const label = d.toLocaleDateString(undefined, { weekday: "short" })
      days.push({ iso, name: label, value: 0 })
    }

    const map = new Map(days.map((d) => [d.iso, d]))

    for (const a of filteredForChart) {
      const iso = String(a?.fields?.["Activity Date"] || "").slice(0, 10)
      if (!iso) continue
      const bucket = map.get(iso)
      if (bucket) bucket.value += 1
    }

    return days
  }, [filteredForChart])

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

        <StatCard title="Upcoming follow-ups" value={upcoming.length} sub={upcoming.length ? `Next: ${String(upcoming[0]?.fields?.["Next Follow-up Date"] || "").slice(0, 10)}` : "—"} />

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
                    style={{
                      ...segBtn,
                      ...(active ? segBtnActive : null)
                    }}
                    onClick={() => setChartFilter(k)}
                  >
                    {k}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={weeklyChartData}>
                <XAxis dataKey="name" stroke="rgba(0,0,0,0.35)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ fontWeight: 900 }}
                  formatter={(v) => [v, chartFilter === "All" ? "Activities" : chartFilter]}
                />
                <Bar dataKey="value" fill="#145c43" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
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

/* ================= STYLES (más profesional) ================= */

const page = { width: "100%" }

const loadingText = {
  padding: 20,
  fontWeight: 800,
  color: "#0f3d2e"
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
  color: "#0f3d2e"
}

const subtitle = {
  marginTop: 6,
  color: "rgba(0,0,0,0.55)",
  fontWeight: 700
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
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 10px 30px rgba(15,61,46,0.08)"
}

const cardLabel = {
  fontSize: 12,
  fontWeight: 900,
  color: "rgba(20,92,67,0.85)",
  textTransform: "uppercase",
  letterSpacing: "0.3px"
}

const cardValue = {
  marginTop: 10,
  fontSize: 36,
  fontWeight: 950,
  color: "#0f3d2e",
  lineHeight: 1.1
}

const cardSub = {
  marginTop: 10,
  fontSize: 12,
  color: "rgba(0,0,0,0.55)",
  fontWeight: 700,
  minHeight: 16
}

const panel = {
  background: "rgba(255,255,255,0.60)",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 16,
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
  color: "#0f3d2e"
}

const panelSub = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 700,
  color: "rgba(0,0,0,0.50)"
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
  color: "rgba(0,0,0,0.60)"
}

const segBtnActive = {
  background: "rgba(20,92,67,0.12)",
  color: "#145c43"
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(12px)",
  fontWeight: 800
}

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
  letterSpacing: "0.3px"
}

const taskNote = {
  marginTop: 6,
  fontWeight: 700,
  color: "rgba(0,0,0,0.70)",
  fontSize: 13,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const taskDate = {
  fontWeight: 900,
  color: "rgba(0,0,0,0.55)",
  fontSize: 12,
  whiteSpace: "nowrap"
}

const emptyText = {
  marginTop: 12,
  fontWeight: 800,
  color: "rgba(0,0,0,0.55)",
  fontSize: 13
}

const btnGhost = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.70)",
  backdropFilter: "blur(14px)",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12
}

const errBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 12,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)",
  fontWeight: 800
}
