import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Leads() {

  const [leads, setLeads] = useState([])
  const [filterStatus, setFilterStatus] = useState("All")
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")
  const navigate = useNavigate()

  useEffect(() => {
    fetch("/api/crm?action=getContacts", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => setLeads(data.records || []))
  }, [])

  const statuses = [
    "All",
    "Not Contacted",
    "Contacted",
    "Replied",
    "Meeting Booked",
    "Closed Won",
    "Closed Lost"
  ]

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filtered = leads.filter(lead => {
    if (filterStatus === "All") return true
    return lead.fields.Status === filterStatus
  })

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0

    const aVal = a.fields[sortField] || ""
    const bVal = b.fields[sortField] || ""

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  return (
    <div>
      <h1 style={title}>Leads</h1>

      {/* FILTER */}
      <div style={filterWrapper}>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={select}
        >
          {statuses.map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div style={glassCard}>

        {/* HEADER */}
        <div style={headerRow}>
          <HeaderCell label="Name" field="Full Name" onSort={handleSort} />
          <HeaderCell label="Position" field="Position" onSort={handleSort} />
          <HeaderCell label="Company" field="Company" onSort={handleSort} />
          <HeaderCell label="Website" field="Website" onSort={handleSort} />
          <HeaderCell label="LinkedIn" field="LinkedIn" onSort={handleSort} />
          <HeaderCell label="Status" field="Status" onSort={handleSort} />
        </div>

        {sorted.map(lead => (
          <div
            key={lead.id}
            style={row}
            onClick={() => navigate(`/leads/${lead.id}`)}
          >
            <div style={name}>{lead.fields["Full Name"]}</div>
            <div style={subText}>{lead.fields.Position}</div>
            <div style={subText}>
              {Array.isArray(lead.fields.Company)
                ? lead.fields.Company[0]
                : lead.fields.Company}
            </div>
            <div style={linkCell}>
              {lead.fields.Website && (
                <a href={lead.fields.Website} target="_blank" rel="noreferrer">
                  Visit
                </a>
              )}
            </div>
            <div style={linkCell}>
              {lead.fields.LinkedIn && (
                <a href={lead.fields.LinkedIn} target="_blank" rel="noreferrer">
                  Profile
                </a>
              )}
            </div>
            <Status status={lead.fields.Status} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ======================= */
/* HEADER COMPONENT */
/* ======================= */

function HeaderCell({ label, field, onSort }) {
  return (
    <div
      style={headerCell}
      onClick={() => onSort(field)}
    >
      {label}
    </div>
  )
}

/* ======================= */
/* STATUS */
/* ======================= */

function Status({ status }) {
  const colors = {
    "Not Contacted": "#8e8e93",
    "Contacted": "#1e7a57",
    "Replied": "#0f3d2e",
    "Meeting Booked": "#34c759",
    "Closed Won": "#30d158",
    "Closed Lost": "#ff3b30"
  }

  return (
    <span style={{
      padding: "6px 14px",
      borderRadius: "18px",
      fontSize: "12px",
      fontWeight: "600",
      background: colors[status] || "#ccc",
      color: "#ffffff"
    }}>
      {status}
    </span>
  )
}

/* ======================= */
/* STYLES */
/* ======================= */

const title = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#0f3d2e",
  marginBottom: "30px"
}

const filterWrapper = {
  marginBottom: "20px"
}

const select = {
  padding: "10px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(20px)"
}

const glassCard = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  WebkitBackdropFilter: "blur(30px)",
  borderRadius: "26px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 20px 50px rgba(15,61,46,0.12)",
  paddingBottom: "10px"
}

const headerRow = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
  padding: "18px 30px",
  fontWeight: "600",
  color: "#145c43",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  cursor: "pointer"
}

const headerCell = {
  cursor: "pointer"
}

const row = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
  padding: "20px 30px",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  cursor: "pointer",
  alignItems: "center"
}

const name = {
  fontWeight: "600",
  color: "#0f3d2e"
}

const subText = {
  color: "#1e7a57",
  fontSize: "14px"
}

const linkCell = {
  fontSize: "14px"
}
