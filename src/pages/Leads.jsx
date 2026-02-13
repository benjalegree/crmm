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
      <p style={subtitle}>All your contacts in one clean workspace</p>

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
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0px)"}
          >
            <div style={nameCell}>
              {lead.fields["Full Name"]}
            </div>

            <div style={secondaryText}>
              {lead.fields.Position}
            </div>

            <div style={secondaryText}>
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
      padding: "10px 18px",
      borderRadius: "40px",
      fontSize: "13px",
      fontWeight: "600",
      background: colors[status] || "#ccc",
      color: "white",
      boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
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
  padding: "18px 24px",
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.9)",
  backdropFilter: "blur(40px)",
  background: "rgba(255,255,255,0.5)",
  width: "350px",
  fontSize: "14px",
  outline: "none",
  boxShadow: "0 15px 40px rgba(0,0,0,0.05)"
}

const tableContainer = {
  display: "flex",
  flexDirection: "column",
  gap: "16px"
}

const headerRow = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  padding: "0 25px",
  fontSize: "13px",
  fontWeight: "600",
  color: "#6e6e73"
}

const row = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  padding: "28px 25px",
  borderRadius: "28px",
  backdropFilter: "blur(40px)",
  background: "rgba(255,255,255,0.45)",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.06)",
  cursor: "pointer",
  transition: "all 0.25s ease"
}

const nameCell = {
  fontWeight: "600",
  fontSize: "15px",
  color: "#1c1c1e"
}

const secondaryText = {
  fontSize: "14px",
  color: "#6e6e73"
}
