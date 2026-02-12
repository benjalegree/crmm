import { useEffect, useState } from "react"

export default function Dashboard() {

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await fetch("/api/getDashboardStats", {
        credentials: "include"
      })

      const data = await res.json()
      setStats(data)
      setLoading(false)

    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  if (loading) return <div>Loading dashboard...</div>
  if (!stats) return <div>Error loading dashboard</div>

  return (
    <div>
      <h1 style={title}>Dashboard</h1>

      <div style={grid}>

        <Card label="Total Leads" value={stats.totalLeads} />
        <Card label="New (7 days)" value={stats.newLeads} />

        <Card label="Contacted" value={stats.contacted} />
        <Card label="Replied" value={stats.replied} />
        <Card label="Meetings Booked" value={stats.meetingBooked} />

        <Card label="Closed Won" value={stats.closedWon} />
        <Card label="Closed Lost" value={stats.closedLost} />

        <Card 
          label="Activities This Week" 
          value={stats.activitiesThisWeek} 
        />

        <Card 
          label="Upcoming Follow-ups" 
          value={stats.upcomingFollowUps} 
        />

        <Card 
          label="Overdue Follow-ups" 
          value={stats.overdueFollowUps} 
          highlight={stats.overdueFollowUps > 0}
        />

      </div>
    </div>
  )
}

function Card({ label, value, highlight }) {
  return (
    <div style={{
      ...card,
      border: highlight ? "2px solid #ff3b30" : "1px solid #e5e5e5"
    }}>
      <div style={cardValue}>{value}</div>
      <div style={cardLabel}>{label}</div>
    </div>
  )
}

const title = {
  fontSize: "28px",
  fontWeight: "600",
  marginBottom: "30px"
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px"
}

const card = {
  background: "#fff",
  padding: "25px",
  borderRadius: "16px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  textAlign: "center"
}

const cardValue = {
  fontSize: "32px",
  fontWeight: "700",
  marginBottom: "10px"
}

const cardLabel = {
  fontSize: "14px",
  color: "#666"
}
