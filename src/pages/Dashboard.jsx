import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [calendar, setCalendar] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch("/api/crm?action=me", { credentials: "include" })
      .then(res => res.json())
      .then(data => setUser(data))

    fetch("/api/crm?action=getDashboardStats", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => setStats(data))

    fetch("/api/crm?action=getCalendar", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => setCalendar(data.records || []))
  }, [])

  if (!stats || !calendar || !user) {
    return <div style={{ color: "#0f3d2e" }}>Loading...</div>
  }

  const today = new Date().toISOString().split("T")[0]

  const todayActivities = calendar.filter(a =>
    a.fields["Activity Date"]?.startsWith(today)
  )

  const upcoming = calendar.filter(a => {
    const next = a.fields["Next Follow-up Date"]
    return next && next >= today
  })

  const getName = (email) => {
    if (email === "benjamin.alegre@psicofunnel.com") return "Benjamin"
    if (email === "sarahduatorrss@gmail.com") return "Sarah"
    return "User"
  }

  const chartData = [
    { name: "Calls", value: stats.calls },
    { name: "Emails", value: stats.emails },
    { name: "Meetings", value: stats.meetings }
  ]

  const productivity =
    todayActivities.length >= 5
      ? 100
      : todayActivities.length * 20

  return (
    <div>
      <h1 style={greeting}>
        Good Morning {getName(user.email)}
      </h1>

      <div style={grid}>

        <div style={glassCard}>
          <div style={cardTitle}>Today Activity</div>
          <div style={bigNumber}>{todayActivities.length}</div>
          <div style={progressBar}>
            <div
              style={{
                ...progressFill,
                width: `${productivity}%`
              }}
            />
          </div>
        </div>

        <div style={glassCard}>
          <div style={cardTitle}>Upcoming Follow-ups</div>
          <div style={bigNumber}>{upcoming.length}</div>
        </div>

        <div style={glassCard}>
          <div style={cardTitle}>Total Leads</div>
          <div style={bigNumber}>{stats.totalLeads}</div>
        </div>

      </div>

      <div style={bottomGrid}>

        <div style={largeGlass}>
          <div style={cardTitle}>Weekly Overview</div>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#145c43" />
                <Tooltip />
                <Bar dataKey="value" fill="#1e7a57" radius={[10,10,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={largeGlass}>
          <div style={cardTitle}>Next Follow-up</div>

          {upcoming.length === 0 && (
            <div style={subText}>No upcoming tasks</div>
          )}

          {upcoming.slice(0,3).map(a => (
            <div key={a.id} style={taskItem}>
              {a.fields["Activity Type"]} –{" "}
              {a.fields["Next Follow-up Date"]}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

/* ================= STYLES ================= */

const greeting = {
  fontSize: "38px",
  fontWeight: "700",
  color: "#0f3d2e",
  marginBottom: "50px"
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
  gap: "30px"
}

const bottomGrid = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "40px",
  marginTop: "60px"
}

const glassCard = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  borderRadius: "30px",
  padding: "40px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 25px 70px rgba(15,61,46,0.15)"
}

const largeGlass = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  borderRadius: "30px",
  padding: "45px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 25px 70px rgba(15,61,46,0.15)"
}

const cardTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1e7a57",
  marginBottom: "20px"
}

const bigNumber = {
  fontSize: "42px",
  fontWeight: "700",
  color: "#0f3d2e"
}

const subText = {
  fontSize: "14px",
  color: "#145c43"
}

const taskItem = {
  padding: "12px 0",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  fontSize: "14px",
  color: "#0f3d2e"
}

const progressBar = {
  marginTop: "20px",
  height: "8px",
  background: "rgba(0,0,0,0.05)",
  borderRadius: "10px",
  overflow: "hidden"
}

const progressFill = {
  height: "100%",
  background: "linear-gradient(90deg,#145c43,#1e7a57)"
}
