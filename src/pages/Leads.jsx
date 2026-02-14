import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Leads() {
  const navigate = useNavigate()

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("All")
  const [sortKey, setSortKey] = useState("Full Name")
  const [sortDir, setSortDir] = useState("asc")

  const [showPanel, setShowPanel] = useState(false)
  const [primaryKey, setPrimaryKey] = useState("Full Name") // lo que “va al frente” en cada fila

  // ✅ mismas columnas, pero ahora en formato “lista”
  const [columns, setColumns] = useState([
    { key: "Full Name", label: "Name", visible: true },
    { key: "Position", label: "Position", visible: true },
    { key: "CompanyName", label: "Company", visible: true },
    { key: "CompanyWebsite", label: "Website", visible: true },
    { key: "Email", label: "Email", visible: false },
    { key: "Numero de telefono", label: "Phone", visible: false },
    { key: "LinkedIn URL", label: "LinkedIn", visible: true },
    { key: "Status", label: "Status", visible: true }
  ])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setErr("")
      try {
        const res = await fetch("/api/crm?action=getContacts", {
          credentials: "include"
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setErr(data?.error || "Failed to load leads")
          setLeads([])
          setLoading(false)
          return
        }
        setLeads(data.records || [])
        setLoading(false)
      } catch {
        setErr("Failed to load leads")
        setLeads([])
        setLoading(false)
      }
    }
    run()
  }, [])

  const toggleColumn = (key) => {
    setColumns((cols) =>
      cols.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    )
  }

  const visibleColumns = useMemo(() => columns.filter((c) => c.visible), [columns])

  const allStatuses = useMemo(() => {
    const base = [
      "Not Contacted",
      "Contacted",
      "Replied",
      "Meeting Booked",
      "Closed Won",
      "Closed Lost"
    ]
    return base
  }, [])

  const normalizeStr = (v) => String(v || "").toLowerCase()

  const getField = (fields, key) => {
    // tu backend ya te trae CompanyWebsite en getContacts (enriched)
    // CompanyName puede venir como lookup o array, lo normalizamos
    if (key === "CompanyName") {
      const v = fields.CompanyName ?? fields.Company ?? ""
      if (Array.isArray(v)) return v[0] || ""
      return v || ""
    }

    if (key === "CompanyWebsite") {
      return fields.CompanyWebsite || fields.Website || fields["Company Website"] || ""
    }

    if (key === "Full Name") return fields["Full Name"] || ""
    if (key === "LinkedIn URL") return fields["LinkedIn URL"] || ""

    if (key === "Company") {
      return Array.isArray(fields.Company) ? fields.Company[0] : fields.Company || ""
    }

    return fields[key] || ""
  }

  const filteredSorted = useMemo(() => {
    const q = normalizeStr(search)

    let list = leads || []

    if (q) {
      list = list.filter((l) => {
        const f = l.fields || {}
        const hay =
          normalizeStr(getField(f, "Full Name")).includes(q) ||
          normalizeStr(getField(f, "Position")).includes(q) ||
          normalizeStr(getField(f, "CompanyName")).includes(q) ||
          normalizeStr(getField(f, "Email")).includes(q) ||
          normalizeStr(getField(f, "Numero de telefono")).includes(q)
        return hay
      })
    }

    if (filterStatus !== "All") {
      list = list.filter((l) => (l.fields?.Status || "") === filterStatus)
    }

    const dir = sortDir === "asc" ? 1 : -1
    const sk = sortKey

    list = [...list].sort((a, b) => {
      const av = normalizeStr(getField(a.fields || {}, sk))
      const bv = normalizeStr(getField(b.fields || {}, sk))
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })

    return list
  }, [leads, search, filterStatus, sortKey, sortDir])

  const setSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir("asc")
  }

  return (
    <div style={page}>
      <div style={head}>
        <div>
          <h1 style={title}>Leads</h1>
          <p style={subtitle}>All your contacts in one clean workspace</p>
        </div>

        <button style={ghostBtn} onClick={() => setShowPanel((s) => !s)}>
          Customize
        </button>
      </div>

      <div style={controls}>
        <input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />

        <div style={selectRow}>
          <div style={selectWrap}>
            <span style={selectLabel}>Status</span>
            <select
              style={select}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All</option>
              {allStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div style={selectWrap}>
            <span style={selectLabel}>Order</span>
            <select
              style={select}
              value={`${sortKey}__${sortDir}`}
              onChange={(e) => {
                const [k, d] = e.target.value.split("__")
                setSortKey(k)
                setSortDir(d)
              }}
            >
              <option value={`Full Name__asc`}>Name A → Z</option>
              <option value={`Full Name__desc`}>Name Z → A</option>
              <option value={`CompanyName__asc`}>Company A → Z</option>
              <option value={`CompanyName__desc`}>Company Z → A</option>
              <option value={`Status__asc`}>Status A → Z</option>
              <option value={`Status__desc`}>Status Z → A</option>
              <option value={`Position__asc`}>Position A → Z</option>
              <option value={`Position__desc`}>Position Z → A</option>
            </select>
          </div>
        </div>
      </div>

      {showPanel && (
        <div style={panel}>
          <div style={panelTop}>
            <div style={panelTitle}>Customize list</div>

            <div style={selectWrapInline}>
              <span style={selectLabel}>Primary field</span>
              <select
                style={select}
                value={primaryKey}
                onChange={(e) => setPrimaryKey(e.target.value)}
              >
                {columns.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={panelGrid}>
            {columns.map((col) => (
              <div key={col.key} style={pill}>
                <span style={pillText}>{col.label}</span>

                <div
                  style={{
                    ...toggle,
                    background: col.visible ? "rgba(20,92,67,0.85)" : "rgba(0,0,0,0.10)"
                  }}
                  onClick={() => toggleColumn(col.key)}
                  role="button"
                >
                  <div
                    style={{
                      ...circle,
                      transform: col.visible ? "translateX(20px)" : "translateX(2px)"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {err ? <div style={errBox}>{err}</div> : null}

      {loading ? (
        <div style={loadingBox}>Loading...</div>
      ) : (
        <div style={list}>
          <div style={listHeader}>
            <button style={headerBtn} onClick={() => setSort("Full Name")}>
              Name {sortKey === "Full Name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>

            <button style={headerBtn} onClick={() => setSort("Position")}>
              Position {sortKey === "Position" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>

            <button style={headerBtn} onClick={() => setSort("CompanyName")}>
              Company {sortKey === "CompanyName" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>

            <button style={headerBtn} onClick={() => setSort("Status")}>
              Status {sortKey === "Status" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>
          </div>

          {filteredSorted.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              onOpen={() => navigate(`/leads/${lead.id}`)}
              visibleColumns={visibleColumns}
              primaryKey={primaryKey}
              getField={getField}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ========================= */
/* ROW (LISTA COMO EN TU IMAGEN) */
/* ========================= */

function LeadRow({ lead, onOpen, visibleColumns, primaryKey, getField }) {
  const f = lead.fields || {}

  const primaryValue = getField(f, primaryKey)
  const name = getField(f, "Full Name")
  const position = getField(f, "Position")
  const companyName = getField(f, "CompanyName")
  const status = getField(f, "Status")
  const website = getField(f, "CompanyWebsite")
  const linkedin = getField(f, "LinkedIn URL")

  return (
    <div style={row} onClick={onOpen}>
      {/* PRIMARY */}
      <div style={colName}>
        <div style={bigName}>
          {primaryKey === "Full Name" ? (name || "—") : (String(primaryValue || "—"))}
        </div>
        <div style={miniLine}>
          <span style={muted}>{position || "—"}</span>
          <span style={dot}>•</span>
          <span style={muted}>{companyName || "—"}</span>
        </div>
      </div>

      {/* POSITION */}
      <div style={colText}>{position || "—"}</div>

      {/* COMPANY + WEBSITE BUTTON */}
      <div style={colCompany}>
        <div style={companyLine}>
          <span style={companyText}>{companyName || "—"}</span>
          {website ? (
            <a
              href={safeUrl(website)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={siteBtn}
              title="Open website"
            >
              Website ↗
            </a>
          ) : null}
        </div>

        {linkedin ? (
          <a
            href={linkedin}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={miniLinkBtn}
            title="Open LinkedIn"
          >
            LinkedIn ↗
          </a>
        ) : null}
      </div>

      {/* STATUS PILL */}
      <div style={colStatus}>
        <span style={{ ...statusPill, ...statusColor(status) }}>
          {status || "—"}
        </span>
      </div>
    </div>
  )
}

/* ========================= */
/* HELPERS */
/* ========================= */

function safeUrl(url) {
  const s = String(url || "").trim()
  if (!s) return "#"
  if (s.startsWith("http://") || s.startsWith("https://")) return s
  return `https://${s}`
}

function statusColor(status) {
  const s = String(status || "")
  if (s === "Meeting Booked") return { background: "rgba(30,180,90,0.18)", borderColor: "rgba(30,180,90,0.35)", color: "#0f5132" }
  if (s === "Replied") return { background: "rgba(80,70,210,0.16)", borderColor: "rgba(80,70,210,0.30)", color: "#2b2a7a" }
  if (s === "Contacted") return { background: "rgba(20,120,255,0.14)", borderColor: "rgba(20,120,255,0.26)", color: "#0b3a8a" }
  if (s === "Closed Won") return { background: "rgba(0,200,120,0.18)", borderColor: "rgba(0,200,120,0.35)", color: "#0f5132" }
  if (s === "Closed Lost") return { background: "rgba(255,0,0,0.10)", borderColor: "rgba(255,0,0,0.18)", color: "#7a1d1d" }
  return { background: "rgba(0,0,0,0.06)", borderColor: "rgba(0,0,0,0.10)", color: "rgba(0,0,0,0.70)" }
}

/* ========================= */
/* STYLES */
/* ========================= */

const page = { width: "100%" }

const head = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 14
}

const title = {
  fontSize: 40,
  fontWeight: 900,
  color: "#0f3d2e",
  margin: 0
}

const subtitle = {
  marginTop: 8,
  marginBottom: 0,
  color: "rgba(0,0,0,0.55)",
  fontWeight: 600
}

const controls = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 16,
  marginBottom: 18,
  flexWrap: "wrap"
}

const searchInput = {
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(18px)",
  outline: "none",
  minWidth: 320,
  flex: "1 1 320px"
}

const selectRow = { display: "flex", gap: 12, flexWrap: "wrap" }

const selectWrap = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(18px)"
}

const selectWrapInline = {
  display: "flex",
  alignItems: "center",
  gap: 10
}

const selectLabel = { fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.55)" }

const select = {
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.85)",
  borderRadius: 14,
  padding: "10px 12px",
  outline: "none",
  fontWeight: 800
}

const ghostBtn = {
  padding: "12px 14px",
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(18px)",
  cursor: "pointer",
  fontWeight: 900
}

const panel = {
  padding: 18,
  marginBottom: 18,
  borderRadius: 28,
  background: "rgba(255,255,255,0.60)",
  backdropFilter: "blur(35px)",
  border: "1px solid rgba(255,255,255,0.45)"
}

const panelTop = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
  flexWrap: "wrap"
}

const panelTitle = { fontWeight: 900, color: "#0f3d2e" }

const panelGrid = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12
}

const pill = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "10px 14px",
  borderRadius: 20,
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.50)",
  minWidth: 190
}

const pillText = { fontWeight: 800, color: "#0f3d2e" }

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

const errBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)"
}

const loadingBox = { padding: 20, color: "rgba(0,0,0,0.55)" }

const list = {
  borderRadius: 28,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.45)",
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)"
}

const listHeader = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 0.8fr",
  gap: 12,
  padding: "16px 18px",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  color: "rgba(0,0,0,0.55)"
}

const headerBtn = {
  textAlign: "left",
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontWeight: 900,
  color: "rgba(0,0,0,0.55)"
}

const row = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 0.8fr",
  gap: 12,
  padding: "18px 18px",
  borderTop: "1px solid rgba(0,0,0,0.05)",
  cursor: "pointer"
}

const colName = { display: "flex", flexDirection: "column", gap: 6 }
const bigName = { fontWeight: 900, color: "#0f3d2e", fontSize: 16 }

const miniLine = { display: "flex", alignItems: "center", gap: 10 }
const muted = { color: "rgba(0,0,0,0.55)", fontWeight: 700, fontSize: 12 }
const dot = { color: "rgba(0,0,0,0.20)", fontWeight: 900 }

const colText = { color: "rgba(0,0,0,0.65)", fontWeight: 700, display: "flex", alignItems: "center" }

const colCompany = { display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }
const companyLine = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }
const companyText = { color: "rgba(0,0,0,0.70)", fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }

const siteBtn = {
  padding: "8px 10px",
  borderRadius: 14,
  border: "1px solid rgba(20,92,67,0.20)",
  background: "rgba(20,92,67,0.10)",
  color: "#145c43",
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 12,
  whiteSpace: "nowrap"
}

const miniLinkBtn = {
  width: "fit-content",
  padding: "8px 10px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.75)",
  color: "rgba(0,0,0,0.70)",
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 12
}

const colStatus = { display: "flex", alignItems: "center", justifyContent: "flex-end" }

const statusPill = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.10)",
  fontWeight: 900,
  fontSize: 12,
  whiteSpace: "nowrap"
}
