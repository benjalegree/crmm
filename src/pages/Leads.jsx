import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Leads() {

  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [filterStatus, setFilterStatus] = useState("All")
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")
  const [showPanel, setShowPanel] = useState(false)

  const defaultColumns = [
    { key: "Full Name", label: "Name", visible: true },
    { key: "Position", label: "Position", visible: true },
    { key: "Company", label: "Company", visible: true },
    { key: "Email", label: "Email", visible: true },
    { key: "Phone", label: "Phone", visible: true },
    { key: "LinkedIn", label: "LinkedIn", visible: true },
    { key: "CompanyWebsite", label: "Website", visible: true },
    { key: "Status", label: "Status", visible: true }
  ]

  const [columns, setColumns] = useState(defaultColumns)

  useEffect(() => {
    fetch("/api/crm?action=getContacts", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => setLeads(data.records || []))
  }, [])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const toggleColumn = (key) => {
    setColumns(cols =>
      cols.map(c =>
        c.key === key ? { ...c, visible: !c.visible } : c
      )
    )
  }

  const filtered = leads.filter(lead =>
    filterStatus === "All" ? true : lead.fields.Status === filterStatus
  )

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0

    const aVal = a.fields[sortField] || ""
    const bVal = b.fields[sortField] || ""

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const visibleColumns = columns.filter(c => c.visible)

  return (
    <div>
      <h1 style={title}>Leads</h1>

      <div style={topBar}>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={select}
        >
          <option>All</option>
          <option>Not Contacted</option>
          <option>Contacted</option>
          <option>Replied</option>
          <option>Meeting Booked</option>
          <option>Closed Won</option>
          <option>Closed Lost</option>
        </select>

        <button style={configButton} onClick={() => setShowPanel(!showPanel)}>
          Columns
        </button>
      </div>

      {showPanel && (
        <div style={panel}>
          {columns.map(col => (
            <label key={col.key} style={panelItem}>
              <input
                type="checkbox"
                checked={col.visible}
                onChange={() => toggleColumn(col.key)}
              />
              {col.label}
            </label>
          ))}
        </div>
      )}

      <div style={glassCard}>
        <div style={{ ...row, fontWeight: "600", color: "#145c43" }}>
          {visibleColumns.map(col => (
            <div
              key={col.key}
              onClick={() => handleSort(col.key)}
              style={{ cursor: "pointer" }}
            >
              {col.label}
            </div>
          ))}
        </div>

        {sorted.map(lead => (
          <div
            key={lead.id}
            style={row}
            onClick={() => navigate(`/leads/${lead.id}`)}
          >
            {visibleColumns.map(col => (
              <div key={col.key}>
                {renderCell(lead.fields, col.key)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function renderCell(fields, key) {
  if (key === "LinkedIn" && fields.LinkedIn)
    return <a href={fields.LinkedIn} target="_blank" rel="noreferrer">Profile</a>

  if (key === "CompanyWebsite" && fields.CompanyWebsite)
    return <a href={fields.CompanyWebsite} target="_blank" rel="noreferrer">Visit</a>

  if (key === "Status")
    return <span style={statusStyle}>{fields.Status}</span>

  if (key === "Company")
    return Array.isArray(fields.Company)
      ? fields.Company[0]
      : fields.Company

  return fields[key]
}

/* ======================= */
/* STYLES */
/* ======================= */

const title = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#0f3d2e",
  marginBottom: "20px"
}

const topBar = {
  display: "flex",
  gap: "15px",
  marginBottom: "20px"
}

const select = {
  padding: "10px 14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(0,0,0,0.08)"
}

const configButton = {
  padding: "10px 18px",
  borderRadius: "14px",
  background: "#145c43",
  color: "#fff",
  border: "none",
  cursor: "pointer"
}

const panel = {
  marginBottom: "20px",
  padding: "20px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(20px)",
  display: "flex",
  gap: "20px",
  flexWrap: "wrap"
}

const panelItem = {
  fontSize: "14px",
  color: "#145c43"
}

const glassCard = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  borderRadius: "26px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 20px 50px rgba(15,61,46,0.12)"
}

const row = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
  padding: "18px 30px",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  alignItems: "center",
  cursor: "pointer"
}

const statusStyle = {
  padding: "6px 12px",
  borderRadius: "14px",
  background: "#145c43",
  color: "#fff",
  fontSize: "12px"
}
