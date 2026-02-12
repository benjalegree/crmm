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
      <h1>Dashboard</h1>

      <div style={grid}>
        <Card title="My Leads" value={stats.totalLeads} />
        <Card title="Meetings Booked" value={stats.meetings} />
        <Card title="Calls Made" value={stats.calls} />
        <Card title="Emails Sent" value={stats.emails} />
      </div>
    </div>
  )
}

function Card({ title, value }) {
  return (
    <div style={card}>
      <h3>{title}</h3>
      <p style={number}>{value || 0}</p>
    </div>
  )
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "20px",
  marginTop: "30px"
}

const card = {
  background: "white",
  padding: "30px",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
}

const number = {
  fontSize: "32px",
  fontWeight: "bold",
  marginTop: "10px"
}
