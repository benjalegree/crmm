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

  /* ========================= */
  /* FILTER + SEARCH */
  /* ========================= */

  const processedLeads = leads
    .filter(l =>
      filterStatus === "All" ? true : l.fields.Status === filterStatus
    )
    .filter(l =>
      Object.values(l.fields)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    )

  /* ========================= */
  /* COLUMN VISIBILITY */
  /* ========================= */

  const toggleColumn = key => {
    setColumns(cols =>
      cols.map(c => c.key === key ? { ...c, visible: !c.visible } : c)
    )
  }

  /* ========================= */
  /* DRAG REORDER */
  /* ========================= */

  const handleDragStart = index => {
    setDraggedColumn(index)
  }

  const handleDrop = index => {
    const updated = [...columns]
    const [removed] = updated.splice(draggedColumn, 1)
    updated.splice(index, 0, removed)
    setColumns(updated)
  }

  /* ========================= */
  /* RESIZE */
  /* ========================= */

  const startResize = (e, index) => {
    const startX = e.clientX
    const startWidth = columns[index].width

    const onMouseMove = e => {
      const newWidth = startWidth + (e.clientX - startX)
      setColumns(cols =>
        cols.map((c, i) =>
          i === index ? { ...c, width: Math.max(80, newWidth) } : c
        )
      )
    }

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }

  /* ========================= */
  /* RENDER */
  /* ========================= */

  const visibleColumns = columns.filter(c => c.visible)

  return (
    <div style={page}>

      <h1 style={title}>Leads</h1>

      {/* Top Controls */}
      <div style={topBar}>

        <input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={searchInput}
        />

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

        <button style={btn} onClick={() => setView(view === "table" ? "kanban" : "table")}>
          {view === "table" ? "Kanban View" : "Table View"}
        </button>

        <button style={btn} onClick={() => setShowPanel(!showPanel)}>
          Columns
        </button>

      </div>

      {/* COLUMN PANEL */}
      {showPanel && (
        <div style={glassPanel}>
          {columns.map((col, index) => (
            <div key={col.key} style={panelItem}>
              <span>{col.label}</span>
              <input
                type="checkbox"
                checked={col.visible}
                onChange={() => toggleColumn(col.key)}
              />
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {view === "table" && (
        <div style={tableGlass} ref={tableRef}>

          {/* HEADER */}
          <div style={{ display: "flex" }}>
            {visibleColumns.map((col, index) => (
              <div
                key={col.key}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                style={{
                  width: col.width,
                  ...headerCell
                }}
              >
                {col.label}
                <div
                  style={resizer}
                  onMouseDown={e => startResize(e, index)}
                />
              </div>
            ))}
          </div>

          {/* ROWS */}
          {processedLeads.map(lead => (
            <div
              key={lead.id}
              style={{ display: "flex" }}
              onClick={() => navigate(`/leads/${lead.id}`)}
            >
              {visibleColumns.map(col => (
                <div
                  key={col.key}
                  style={{
                    width: col.width,
                    ...cell
                  }}
                >
                  {renderCell(lead.fields, col.key)}
                </div>
              ))}
            </div>
          ))}

        </div>
      )}

      {/* KANBAN VIEW */}
      {view === "kanban" && (
        <div style={kanbanContainer}>
          {["Not Contacted", "Contacted", "Meeting Booked", "Closed Won", "Closed Lost"].map(status => (
            <div key={status} style={kanbanColumn}>
              <h3>{status}</h3>
              {processedLeads
                .filter(l => l.fields.Status === status)
                .map(l => (
                  <div key={l.id} style={kanbanCard}>
                    {l.fields["Full Name"]}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

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
  gap: 10,
  marginBottom: 20
}

const searchInput = {
  padding: 10,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.05)"
}

const select = searchInput

const btn = {
  padding: "10px 16px",
  borderRadius: 14,
  background: "#145c43",
  color: "#fff",
  border: "none",
  cursor: "pointer"
}

const glassPanel = {
  padding: 20,
  marginBottom: 20,
  borderRadius: 24,
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(30px)",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
  gap: 15
}

const panelItem = {
  display: "flex",
  justifyContent: "space-between"
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
  borderRight: "1px solid rgba(0,0,0,0.05)",
  position: "relative",
  cursor: "grab"
}

const cell = {
  padding: 15,
  borderRight: "1px solid rgba(0,0,0,0.05)",
  borderTop: "1px solid rgba(0,0,0,0.05)"
}

const resizer = {
  width: 6,
  cursor: "col-resize",
  position: "absolute",
  right: 0,
  top: 0,
  bottom: 0
}

const kanbanContainer = {
  display: "flex",
  gap: 20
}

const kanbanColumn = {
  flex: 1,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  padding: 20,
  borderRadius: 24
}

const kanbanCard = {
  background: "#145c43",
  color: "#fff",
  padding: 10,
  borderRadius: 14,
  marginBottom: 10
}
