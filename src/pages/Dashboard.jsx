import { useEffect, useState } from "react"

export default function Dashboard() {

  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const res = await fetch("/api/crm?action=getDashboardStats", {
      credentials: "include"
    })

    const data = await res.json()
    setStats(data)
  }

  if (!stats) return <div>Loading dashboard...</div>

  return (
    <div>
      <h1 style={title}>Dashboard</h1>

      {/* PRIMARY METRICS */}
      <div style={grid}>
        <Card title="Total Leads" value={stats.totalLeads} />
        <Card title="Active Leads" value={stats.activeLeads} />
        <Card title="Meetings Booked" value={stats.meetingsBooked} />
        <Card title="Closed Won" value={stats.closedWon} />
      </div>

      {/* PERFORMANCE METRICS */}
      <div style={{ ...grid, marginTop: "30px" }}>
        <Card 
          title="Conversion Rate" 
          value={`${stats.conversionRate}%`} 
        />
        <Card 
          title="Win Rate" 
          value={`${stats.winRate}%`} 
        />
        <Card 
          title="Avg Days Without Contact" 
          value={stats.avgDaysWithoutContact} 
        />
        <Card 
          title="Leads Without Follow-up" 
          value={stats.leadsWithoutFollowUp} 
        />
      </div>

      {/* PIPELINE HEALTH */}
      <div style={{ ...grid, marginTop: "30px" }}>
        <Card 
          title="At Risk (7+ days)" 
          value={stats.atRiskLeads} 
          color="#ff3b30"
        />
        <Card 
          title="Cooling (5–6 days)" 
          value={stats.coolingLeads} 
          color="#ff9500"
        />
      </div>
    </div>
  )
}

function Card({ title, value, color }) {
  return (
    <div style={{
      ...card,
      borderLeft: color ? `6px solid ${color}` : "6px solid #007aff"
    }}>
      <h3 style={cardTitle}>{title}</h3>
      <p style={number}>{value ?? 0}</p>
    </div>
  )
}

const title = {
  fontSize: "28px",
  fontWeight: "600",
  marginBottom: "10px"
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
  marginTop: "20px"
}

const card = {
  background: "white",
  padding: "25px",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: "110px"
}

const cardTitle = {
  fontSize: "14px",
  color: "#666",
  marginBottom: "10px",
  fontWeight: "500"
}

const number = {
  fontSize: "28px",
  fontWeight: "700"
}
