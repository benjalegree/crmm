import { useEffect, useState } from "react"

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch("/api/crm?action=getDashboardStats", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => setStats(data))
  }, [])

  if (!stats) {
    return <div style={{ color: "#0f3d2e" }}>Loading...</div>
  }

  return (
    <div>
      <h1 style={title}>Dashboard</h1>

      <div style={grid}>

        <div style={card}>
          <span style={label}>Total Leads</span>
          <span style={value}>{stats.totalLeads}</span>
        </div>

        <div style={card}>
          <span style={label}>Calls</span>
          <span style={value}>{stats.calls}</span>
        </div>

        <div style={card}>
          <span style={label}>Emails</span>
          <span style={value}>{stats.emails}</span>
        </div>

        <div style={card}>
          <span style={label}>Meetings</span>
          <span style={value}>{stats.meetings}</span>
        </div>

      </div>

      <div style={{ marginTop: "60px" }}>
        <div style={largeCard}>
          <h3 style={{ marginBottom: "20px", color: "#0f3d2e" }}>
            Performance Overview
          </h3>

          <div style={fakeChart}>
            <div style={{ ...bar, height: "40%" }} />
            <div style={{ ...bar, height: "70%" }} />
            <div style={{ ...bar, height: "55%" }} />
            <div style={{ ...bar, height: "85%" }} />
            <div style={{ ...bar, height: "60%" }} />
            <div style={{ ...bar, height: "75%" }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================= */
/* STYLES */
/* ============================= */

const title = {
  fontSize: "34px",
  fontWeight: "700",
  color: "#0f3d2e",
  marginBottom: "40px"
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: "30px"
}

const card = {
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(20px)",
  borderRadius: "24px",
  padding: "30px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 10px 40px rgba(15,61,46,0.12)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minHeight: "140px"
}

const largeCard = {
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(20px)",
  borderRadius: "30px",
  padding: "40px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 15px 50px rgba(15,61,46,0.12)"
}

const label = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#1e7a57",
  marginBottom: "10px"
}

const value = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#0f3d2e"
}

const fakeChart = {
  display: "flex",
  alignItems: "flex-end",
  height: "180px",
  gap: "20px"
}

const bar = {
  width: "30px",
  background: "linear-gradient(180deg,#1e7a57,#0f3d2e)",
  borderRadius: "10px"
}
