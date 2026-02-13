import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Leads() {

  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [filterStatus, setFilterStatus] = useState("All")
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")
  const [showPanel, setShowPanel] = useState(false)

  const [columns, setColumns] = useState([
    { key: "Full Name", label: "Name", visible: true },
    { key: "Position", label: "Position", visible: true },
    { key: "Company Name (Lookup)", label: "Company", visible: true },
    { key: "Email", label: "Email", visible: true },
    { key: "Numero de telefono", label: "Phone", visible: true },
    { key: "LinkedIn URL", label: "LinkedIn", visible: true },
    { key: "Status", label: "Status", visible: true }
  ])

  useEffect(() => {
    fetch("/api/crm?action=getContacts", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => setLeads(data.records || []))
  }, [])

  const toggleColumn = (key) => {
    setColumns(cols =>
      cols.map(c =>
        c.key === key ? { ...c, visible: !c.visible } : c
      )
    )
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const visibleColumns = columns.filter(c => c.visible)

  const filtered = leads.filter(lead =>
    filterStatus === "All" ? true : lead.fields.Status === filterStatus
  )

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0
    const aVal = getFieldValue(a.fields, sortField)
    const bVal = getFieldValue(b.fields, sortField)
    return sortDirection === "asc"
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal)
  })

  return (
    <div style={page}>

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
          <option>Meeting Booked</option>
          <option>Closed Won</option>
          <option>Closed Lost</option>
        </select>

        <button style={columnsBtn} onClick={() => setShowPanel(!showPanel)}>
          Customize Columns
        </button>
      </div>

      {showPanel && (
        <div style={glassPanel}>
          {columns.map(col => (
            <div key={col.key} style={panelItem}>
              <span>{col.label}</span>
              <div
                style={{
                  ...toggle,
                  background: col.visible ? "#145c43" : "#dcdcdc"
                }}
                onClick={() => toggleColumn(col.key)}
              >
                <div
                  style={{
                    ...circle,
                    transform: col.visible ? "translateX(18px)" : "translateX(2px)"
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={tableGlass}>
        <div style={{ ...row, fontWeight: 600 }}>
          {visibleColumns.map(col => (
            <div
              key={col.key}
              style={headerCell}
              onClick={() => handleSort(col.key)}
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

/* ----------------------- */
/* UTILITIES */
/* ----------------------- */

function getFieldValue(fields, key) {
  const value = fields[key]
  if (!value) return ""
  if (Array.isArray(value)) return value[0] || ""
  return value.toString()
}

function renderCell(fields, key) {

  if (key === "Company Name (Lookup)") {
    return getFieldValue(fields, key)
  }

  if (key === "LinkedIn URL" && fields["LinkedIn URL"]) {
    return (
      <a href={fields["LinkedIn URL"]} target="_blank" rel="noreferrer" style={link}>
        Profile
      </a>
    )
  }

  if (key === "Numero de telefono" && fields["Numero de telefono"]) {
    return (
      <a href={`tel:${fields["Numero de telefono"]}`} style={link}>
        {fields["Numero de telefono"]}
      </a>
    )
  }

  if (key === "Status") {
    return <span style={status}>{fields.Status}</span>
  }

  return getFieldValue(fields, key)
}

/* ----------------------- */
/* STYLES */
/* ----------------------- */

const page = {
  width: "100%",
  paddingBottom: "40px"
}

const title = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#0f3d2e",
  marginBottom: "25px"
}

const topBar = {
  display: "flex",
  gap: "15px",
  marginBottom: "25px"
}

const select = {
  padding: "10px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(0,0,0,0.05)",
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(20px)"
}

const columnsBtn = {
  padding: "10px 18px",
  borderRadius: "14px",
  border: "none",
  background: "#145c43",
  color: "#fff",
  cursor: "pointer"
}

const glassPanel = {
  padding: "25px",
  marginBottom: "25px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(30px)",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
  gap: "20px"
}

const panelItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}

const toggle = {
  width: "42px",
  height: "22px",
  borderRadius: "20px",
  position: "relative",
  cursor: "pointer",
  transition: "0.3s"
}

const circle = {
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  background: "#fff",
  position: "absolute",
  top: "2px",
  transition: "0.3s"
}

const tableGlass = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(35px)",
  borderRadius: "28px",
  border: "1px solid rgba(255,255,255,0.4)",
  overflow: "hidden"
}

const row = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
  padding: "18px 25px",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  alignItems: "center",
  cursor: "pointer"
}

const headerCell = {
  cursor: "pointer",
  color: "#145c43"
}

const status = {
  padding: "6px 14px",
  borderRadius: "14px",
  background: "#145c43",
  color: "#fff",
  fontSize: "12px"
}

const link = {
  color: "#145c43",
  textDecoration: "none"
}
