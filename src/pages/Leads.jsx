import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"

export default function Leads() {

  const navigate = useNavigate()
  const tableRef = useRef(null)

  const [leads, setLeads] = useState([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("All")
  const [view, setView] = useState("table")
  const [draggedColumn, setDraggedColumn] = useState(null)
  const [showPanel, setShowPanel] = useState(false)

  const [columns, setColumns] = useState([
    { key: "Full Name", label: "Name", visible: true, width: 200 },
    { key: "Position", label: "Position", visible: true, width: 180 },
    { key: "Company", label: "Company", visible: true, width: 200 },
    { key: "Email", label: "Email", visible: true, width: 220 },
    { key: "Numero de telefono", label: "Phone", visible: true, width: 150 },
    { key: "LinkedIn URL", label: "LinkedIn", visible: true, width: 120 },
    { key: "Status", label: "Status", visible: true, width: 150 }
  ])

  useEffect(() => {
    fetch("/api/crm?action=getContacts", { credentials: "include" })
      .then(res => res.json())
      .then(data => setLeads(data.records || []))
  }, [])

  const toggleColumn = key => {
    setColumns(cols =>
      cols.map(c => c.key === key ? { ...c, visible: !c.visible } : c)
    )
  }

  const visibleColumns = columns.filter(c => c.visible)

  return (
    <div style={page}>

      <h1 style={title}>Leads</h1>

      <div style={topBar}>
        <input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={searchInput}
        />

        <button style={btn} onClick={() => setShowPanel(!showPanel)}>
          Customize Columns
        </button>
      </div>

      {showPanel && (
        <div style={glassPanel}>
          {columns.map(col => (
            <div key={col.key} style={pill}>
              <span style={pillText}>{col.label}</span>

              <div
                style={{
                  ...toggle,
                  background: col.visible ? "#145c43" : "#d9d9d9"
                }}
                onClick={() => toggleColumn(col.key)}
              >
                <div
                  style={{
                    ...circle,
                    transform: col.visible
                      ? "translateX(20px)"
                      : "translateX(2px)"
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={tableGlass}>
        <div style={{ display: "flex" }}>
          {visibleColumns.map(col => (
            <div key={col.key} style={{ width: col.width, ...headerCell }}>
              {col.label}
            </div>
          ))}
        </div>

        {leads.map(lead => (
          <div
            key={lead.id}
            style={{ display: "flex" }}
            onClick={() => navigate(`/leads/${lead.id}`)}
          >
            {visibleColumns.map(col => (
              <div
                key={col.key}
                style={{ width: col.width, ...cell }}
              >
                {renderCell(lead.fields, col.key)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ========================= */
/* CELL RENDER */
/* ========================= */

function renderCell(fields, key) {

  if (key === "Company") {
    return Array.isArray(fields.Company)
      ? fields.Company[0]
      : fields.Company || ""
  }

  if (key === "LinkedIn URL" && fields["LinkedIn URL"]) {
    return <a href={fields["LinkedIn URL"]} target="_blank" rel="noreferrer">Profile</a>
  }

  return fields[key] || ""
}

/* ========================= */
/* STYLES */
/* ========================= */

const page = { width: "100%" }

const title = {
  fontSize: 28,
  fontWeight: 700,
  color: "#0f3d2e",
  marginBottom: 20
}

const topBar = {
  display: "flex",
  gap: 12,
  marginBottom: 20
}

const searchInput = {
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.05)",
  minWidth: 250
}

const btn = {
  padding: "12px 18px",
  borderRadius: 18,
  background: "#145c43",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: 500
}

const glassPanel = {
  padding: 20,
  marginBottom: 20,
  borderRadius: 28,
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(35px)",
  display: "flex",
  flexWrap: "wrap",
  gap: 16
}

/* NEW BEAUTIFUL PILLS */

const pill = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 18px",
  borderRadius: 20,
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.5)"
}

const pillText = {
  fontWeight: 500,
  color: "#0f3d2e"
}

const toggle = {
  width: 44,
  height: 24,
  borderRadius: 30,
  position: "relative",
  cursor: "pointer",
  transition: "0.3s"
}

const circle = {
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "#fff",
  position: "absolute",
  top: 2,
  transition: "0.3s"
}

const tableGlass = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.4)",
  overflowX: "auto"
}

const headerCell = {
  padding: 15,
  fontWeight: 600,
  borderRight: "1px solid rgba(0,0,0,0.05)"
}

const cell = {
  padding: 15,
  borderRight: "1px solid rgba(0,0,0,0.05)",
  borderTop: "1px solid rgba(0,0,0,0.05)"
}
