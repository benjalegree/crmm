import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Leads() {

  const [leads, setLeads] = useState([])
  const [search, setSearch] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    const res = await fetch("/api/crm?action=getContacts", {
      credentials: "include"
    })

    const data = await res.json()
    setLeads(data.records || [])
  }

  const filtered = leads.filter(l =>
    l.fields["Full Name"]?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>

      <h1 style={title}>Leads</h1>
      <p style={subtitle}>Manage and track your pipeline</p>

      <div style={toolbar}>
        <input
          placeholder="Search leads..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={searchInput}
        />
      </div>

      <div style={tableContainer}>
        <div style={headerRow}>
          <div>Name</div>
          <div>Position</div>
          <div>Company</div>
          <div>Status</div>
        </div>

        {filtered.map(lead => (
          <div
            key={lead.id}
            style={row}
            onClick={() => navigate(`/leads/${lead.id}`)}
          >
            <div style={nameCell}>
              {lead.fields["Full Name"]}
            </div>
            <div>{lead.fields.Position}</div>
            <div>
              {Array.isArray(lead.fields.Company)
                ? lead.fields.Company[0]
                : lead.fields.Company}
            </div>
            <Status status={lead.fields.Status} />
          </div>
        ))}

      </div>
    </div>
  )
}

function Status({ status }) {

  const colors = {
    "Not Contacted": "#8e8e93",
    "Contacted": "#007aff",
    "Replied": "#5856d6",
    "Meeting Booked": "#34c759",
    "Closed Won": "#30d158",
    "Closed Lost": "#ff3b30"
  }

  return (
    <span style={{
      padding: "8px 14px",
      borderRadius: "30px",
      fontSize: "13px",
      fontWeight: "500",
      background: colors[status] || "#ccc",
      color: "white",
      boxShadow: "0 8px 20px rgba(0,0,0,0.15)"
    }}>
      {status}
    </span>
  )
}

/* ===================== STYLES ===================== */

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

const toolbar = {
  marginBottom: "30px"
}

const searchInput = {
  padding: "16px 22px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.9)",
  backdropFilter: "blur(30px)",
  background: "rgba(255,255,255,0.4)",
  width: "320px",
  fontSize: "14px",
  outline: "none",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
}

const tableContainer = {
  backdropFilter: "blur(40px)",
  background: "rgba(255,255,255,0.35)",
  borderRadius: "30px",
  padding: "30px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
  border: "1px solid rgba(255,255,255,0.9)"
}

const headerRow = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  paddingBottom: "20px",
  fontSize: "13px",
  fontWeight: "600",
  color: "#6e6e73",
  borderBottom: "1px solid rgba(0,0,0,0.05)"
}

const row = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  padding: "22px 0",
  cursor: "pointer",
  transition: "all 0.2s ease",
  borderBottom: "1px solid rgba(0,0,0,0.04)"
}

const nameCell = {
  fontWeight: "600",
  color: "#1c1c1e"
}
