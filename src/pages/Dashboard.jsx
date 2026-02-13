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

  if (!stats) return <div style={{ padding: "20px" }}>Loading...</div>

  return (
    <div>

      <h1 style={title}>Dashboard</h1>
      <p style={subtitle}>Your pipeline health at a glance</p>

      {/* Primary Metrics */}
      <div style={grid}>
        <MetricCard
          label="Total Leads"
          value={stats.totalLeads}
          accent="rgba(120,180,255,0.4)"
        />
        <MetricCard
          label="Active Leads"
          value={stats.activeLeads}
          accent="rgba(150,255,200,0.4)"
        />
        <MetricCard
          label="Meetings Booked"
          value={stats.meetingsBooked}
          accent="rgba(200,180,255,0.4)"
        />
        <MetricCard
          label="Closed Won"
          value={stats.closedWon}
          accent="rgba(255,210,150,0.4)"
        />
      </div>

      {/* Performance */}
      <div style={{ ...grid, marginTop: "40px" }}>
        <MetricCard
          label="Conversion Rate"
          value={`${stats.conversionRate}%`}
        />
        <MetricCard
          label="Win Rate"
          value={`${stats.winRate}%`}
        />
        <MetricCard
          label="Avg Days Without Contact"
          value={stats.avgDaysWithoutContact}
        />
        <MetricCard
          label="Leads Without Follow-up"
          value={stats.leadsWithoutFollowUp}
        />
      </div>

      {/* Pipeline Health */}
      <div style={{ ...grid, marginTop: "40px" }}>
        <MetricCard
          label="At Risk (7+ days)"
          value={stats.atRiskLeads}
          accent="rgba(255,100,100,0.4)"
        />
        <MetricCard
          label="Cooling (5–6 days)"
          value={stats.coolingLeads}
          accent="rgba(255,180,100,0.4)"
        />
      </div>

    </div>
  )
}

function MetricCard({ label, value, accent }) {
  return (
    <div style={{
      ...card,
      background: accent
        ? `
          linear-gradient(135deg, rgba(255,255,255,0.75), rgba(255,255,255,0.55)),
          radial-gradient(circle at top left, ${accent}, transparent 60%)
        `
        : "rgba(255,255,255,0.65)"
    }}>
      <span style={metricLabel}>{label}</span>
      <span style={metricValue}>{value ?? 0}</span>
    </div>
  )
}

const title = {
  fontSize: "34px",
  fontWeight: "600",
  letterSpacing: "-0.5px"
}

const subtitle = {
  fontSize: "15px",
  color: "#6e6e73",
  marginTop: "8px",
  marginBottom: "40px"
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "30px"
}

const card = {
  backdropFilter: "blur(30px)",
  borderRadius: "26px",
  padding: "35px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
  border: "1px solid rgba(255,255,255,0.6)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: "140px",
  transition: "all 0.25s ease"
}

const metricLabel = {
  fontSize: "14px",
  color: "#6e6e73",
  fontWeight: "500"
}

const metricValue = {
  fontSize: "34px",
  fontWeight: "700",
  marginTop: "15px",
  letterSpacing: "-1px"
}
