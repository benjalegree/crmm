import { useEffect, useState } from "react"

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
    return <div style={{ color: "#0f3d2e" }}>Loading dashboard...</div>
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

  return (
    <div>
      <h1 style={greeting}>
        Good Morning {getName(user.email)}
      </h1>

      <div style={grid}>

        <div style={glassCard}>
          <div style={cardTitle}>Today Activity</div>
          <div style={bigNumber}>{todayActivities.length}</div>
          <div style={subText}>Actions completed today</div>
        </div>

        <div style={glassCard}>
          <div style={cardTitle}>Upcoming Follow-ups</div>
          <div style={bigNumber}>{upcoming.length}</div>
          <div style={subText}>Tasks pending</div>
        </div>

        <div style={glassCard}>
          <div style={cardTitle}>Total Leads</div>
          <div style={bigNumber}>{stats.totalLeads}</div>
          <div style={subText}>Active contacts</div>
        </div>

        <div style={glassCard}>
          <div style={cardTitle}>Meetings</div>
          <div style={bigNumber}>{stats.meetings}</div>
          <div style={subText}>Total meetings</div>
        </div>

      </div>

      <div style={{ marginTop: "60px", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "40px" }}>

        <div style={largeGlass}>
          <div style={cardTitle}>Activity Overview</div>

          <div style={chartContainer}>
            {["Calls","Emails","Meetings"].map((type, i) => {
              const value =
                type === "Calls"
                  ? stats.calls
                  : type === "Emails"
                  ? stats.emails
                  : stats.meetings

              return (
                <div key={type} style={chartBlock}>
                  <div
                    style={{
                      ...chartBar,
                      height: `${value * 15 + 20}px`
                    }}
                  />
                  <span style={chartLabel}>{type}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={largeGlass}>
          <div style={cardTitle}>Today Tasks</div>

          {todayActivities.length === 0 && (
            <div style={subText}>No activity yet today</div>
          )}

          {todayActivities.map(a => (
            <div key={a.id} style={taskItem}>
              {a.fields["Activity Type"]} —{" "}
              {a.fields["Related Contact"]?.[0] || ""}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

/* =============================== */
/* STYLES */
/* =============================== */

const greeting = {
  fontSize: "38px",
  fontWeight: "700",
  color: "#0f3d2e",
  marginBottom: "50px"
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: "30px"
}

const glassCard = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(25px)",
  borderRadius: "28px",
  padding: "35px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 20px 60px rgba(15,61,46,0.15)",
  transition: "all 0.3s ease"
}

const largeGlass = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  borderRadius: "32px",
  padding: "45px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 25px 70px rgba(15,61,46,0.15)"
}

const cardTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1e7a57",
  marginBottom: "15px"
}

const bigNumber = {
  fontSize: "40px",
  fontWeight: "700",
  color: "#0f3d2e"
}

const subText = {
  fontSize: "13px",
  color: "#145c43",
  marginTop: "8px"
}

const chartContainer = {
  display: "flex",
  alignItems: "flex-end",
  gap: "40px",
  marginTop: "40px"
}

const chartBlock = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center"
}

const chartBar = {
  width: "45px",
  background: "linear-gradient(180deg,#1e7a57,#0f3d2e)",
  borderRadius: "14px"
}

const chartLabel = {
  marginTop: "10px",
  fontSize: "13px",
  fontWeight: "600",
  color: "#145c43"
}

const taskItem = {
  padding: "12px 0",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  fontSize: "14px",
  color: "#0f3d2e"
}
