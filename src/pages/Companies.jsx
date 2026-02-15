import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Companies() {
  const navigate = useNavigate()

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")

  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState("Name")
  const [sortDir, setSortDir] = useState("asc")

  const [showPanel, setShowPanel] = useState(false)
  const [primaryKey, setPrimaryKey] = useState("Name")

  // ✅ mismas vibes que Leads: columnas configurables + toggle
  const [columns, setColumns] = useState([
    { key: "Name", label: "Company", visible: true },
    { key: "Industry", label: "Industry", visible: true },
    { key: "Country", label: "Country", visible: true },
    { key: "Company Size", label: "Size", visible: true },
    { key: "Website", label: "Website", visible: true },
    { key: "Responsible Email", label: "Responsible", visible: false },
    { key: "Notes", label: "Notes", visible: false }
  ])

  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const safeErr = (data, fallback) =>
    data?.error ||
    data?.details?.error?.message ||
    data?.details?.error ||
    data?.details?.message ||
    fallback

  const load = async () => {
    setLoading(true)
    setErr("")
    try {
      const res = await fetch(`/api/crm?action=getCompanies`, { credentials: "include" })
      const data = await readJson(res)
      if (!res.ok) {
        setErr(safeErr(data, "Failed to load companies"))
        setRecords([])
        setLoading(false)
        return
      }

      // ✅ fallback defensivo (como tu versión)
      const recs =
        (data?.records && Array.isArray(data.records) && data.records) ||
        (data?.records?.records && Array.isArray(data.records.records) && data.records.records) ||
        (data?.data && Array.isArray(data.data) && data.data) ||
        []

      setRecords(recs)
      setLoading(false)
    } catch {
      setErr("Failed to load companies")
      setRecords([])
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line
  }, [])

  const toggleColumn = (key) => {
    setColumns((cols) =>
      cols.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    )
  }

  const visibleColumns = useMemo(() => columns.filter((c) => c.visible), [columns])

  const normalizeStr = (v) => String(v || "").toLowerCase()

  const getField = (fields, key) => {
    const f = fields || {}

    // Name / Company Name / Company
    if (key === "Name") return f["Name"] || f["Company Name"] || f["Company"] || ""

    // Website / URL
    if (key === "Website") return f["Website"] || f["URL"] || ""

    // Industry / Sector
    if (key === "Industry") return f["Industry"] || f["Sector"] || ""

    // Country / Location
    if (key === "Country") return f["Country"] || f["Location"] || ""

    // Size
    if (key === "Company Size") return f["Company Size"] || f["Size"] || ""

    // Responsible
    if (key === "Responsible Email") return (f["Responsible Email"] || "").toLowerCase()

    // Notes
    if (key === "Notes") return f["Notes"] || ""

    return f[key] || ""
  }

  const filteredSorted = useMemo(() => {
    const q = normalizeStr(search)
    let list = records || []

    if (q) {
      list = list.filter((r) => {
        const f = r?.fields || {}
        const hay =
          normalizeStr(getField(f, "Name")).includes(q) ||
          normalizeStr(getField(f, "Website")).includes(q) ||
          normalizeStr(getField(f, "Industry")).includes(q) ||
          normalizeStr(getField(f, "Country")).includes(q) ||
          normalizeStr(getField(f, "Company Size")).includes(q) ||
          normalizeStr(getField(f, "Responsible Email")).includes(q)
        return hay
      })
    }

    const dir = sortDir === "asc" ? 1 : -1
    const sk = sortKey

    list = [...list].sort((a, b) => {
      const av = normalizeStr(getField(a?.fields || {}, sk))
      const bv = normalizeStr(getField(b?.fields || {}, sk))
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })

    return list
  }, [records, search, sortKey, sortDir])

  const setSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir("asc")
  }

  // ✅ grid columns dinámicas según columnas visibles (pero manteniendo estética Leads)
  const gridCols = useMemo(() => {
    // Queremos 4 columnas “principales” para look limpio.
    // Si el user apaga alguna, redistribuimos sin romper.
    const keys = visibleColumns.map((c) => c.key)

    // Siempre mostramos un bloque principal (Company) más ancho
    const mainKey = "Name"
    const hasMain = keys.includes(mainKey)
    const rest = keys.filter((k) => k !== mainKey)

    const slots = [mainKey, ...rest].slice(0, 4)
    // Si no está Name visible, igual usamos el bloque principal con primaryKey
    if (!hasMain) slots[0] = primaryKey

    const template = "2fr 1fr 1fr 0.8fr" // mismo que Leads
    return { slots, template }
  }, [visibleColumns, primaryKey])

  return (
    <div style={page}>
      <div style={head}>
        <div>
          <h1 style={title}>Companies</h1>
          <p style={subtitle}>All your companies in one clean workspace</p>
        </div>

        <button style={ghostBtn} onClick={() => setShowPanel((s) => !s)}>
          Customize
        </button>
      </div>

      <div style={controls}>
        <input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />

        <div style={selectRow}>
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
              <option value={`Name__asc`}>Company A → Z</option>
              <option value={`Name__desc`}>Company Z → A</option>
              <option value={`Industry__asc`}>Industry A → Z</option>
              <option value={`Industry__desc`}>Industry Z → A</option>
              <option value={`Country__asc`}>Country A → Z</option>
              <option value={`Country__desc`}>Country Z → A</option>
              <option value={`Company Size__asc`}>Size A → Z</option>
              <option value={`Company Size__desc`}>Size Z → A</option>
            </select>
          </div>

          <button style={miniBtn} onClick={load} type="button">
            Refresh
          </button>
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
          <div style={{ ...listHeader, gridTemplateColumns: gridCols.template }}>
            {/* Header buttons (como Leads) */}
            <button style={headerBtn} onClick={() => setSort("Name")}>
              Company {sortKey === "Name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>

            <button style={headerBtn} onClick={() => setSort("Industry")}>
              Industry {sortKey === "Industry" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>

            <button style={headerBtn} onClick={() => setSort("Country")}>
              Country {sortKey === "Country" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>

            <button style={{ ...headerBtn, textAlign: "right" }} onClick={() => setSort("Company Size")}>
              Size {sortKey === "Company Size" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>
          </div>

          {filteredSorted.map((rec) => (
            <CompanyRow
              key={rec.id}
              rec={rec}
              onOpen={() => navigate(`/companies/${rec.id}`)}
              primaryKey={primaryKey}
              getField={getField}
              gridTemplate={gridCols.template}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ========================= */
/* ROW (MISMO FORMATO LISTA) */
/* ========================= */

function CompanyRow({ rec, onOpen, primaryKey, getField, gridTemplate }) {
  const f = rec?.fields || {}

  const primaryValue = getField(f, primaryKey)

  const name = getField(f, "Name")
  const industry = getField(f, "Industry")
  const country = getField(f, "Country")
  const size = getField(f, "Company Size")
  const website = getField(f, "Website")
  const responsible = getField(f, "Responsible Email")
  const notes = getField(f, "Notes")

  return (
    <div style={{ ...row, gridTemplateColumns: gridTemplate }} onClick={onOpen}>
      {/* PRIMARY */}
      <div style={colName}>
        <div style={bigName}>
          {primaryKey === "Name" ? (name || "—") : String(primaryValue || "—")}
        </div>

        <div style={miniLine}>
          {website ? (
            <>
              <a
                href={safeUrl(website)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={miniLinkBtn}
                title="Open website"
              >
                {shortHost(website)} ↗
              </a>
              <span style={dot}>•</span>
            </>
          ) : null}

          {responsible ? (
            <>
              <span style={muted} title={responsible}>
                {responsible}
              </span>
              <span style={dot}>•</span>
            </>
          ) : null}

          {notes ? (
            <span style={muted} title={notes}>
              {String(notes).slice(0, 44)}
              {String(notes).length > 44 ? "…" : ""}
            </span>
          ) : (
            <span style={muted}>—</span>
          )}
        </div>
      </div>

      {/* INDUSTRY */}
      <div style={colText}>{industry || "—"}</div>

      {/* COUNTRY + WEBSITE BUTTON */}
      <div style={colCompany}>
        <div style={companyLine}>
          <span style={companyText}>{country || "—"}</span>

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
      </div>

      {/* SIZE PILL */}
      <div style={colStatus}>
        <span style={{ ...statusPill, ...softGreenPill }}>
          {size || "—"}
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

function shortHost(url) {
  try {
    const u = new URL(safeUrl(url))
    return u.host.replace(/^www\./, "")
  } catch {
    const s = String(url || "").trim().replace(/^https?:\/\//, "")
    return s.split("/")[0].replace(/^www\./, "")
  }
}

/* ========================= */
/* STYLES (IGUALES A LEADS) */
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

const selectRow = { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }

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

const miniBtn = {
  padding: "12px 14px",
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(18px)",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12
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
  gap: 12,
  padding: "18px 18px",
  borderTop: "1px solid rgba(0,0,0,0.05)",
  cursor: "pointer"
}

const colName = { display: "flex", flexDirection: "column", gap: 6 }
const bigName = { fontWeight: 900, color: "#0f3d2e", fontSize: 16 }

const miniLine = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }
const muted = { color: "rgba(0,0,0,0.55)", fontWeight: 700, fontSize: 12 }
const dot = { color: "rgba(0,0,0,0.20)", fontWeight: 900 }

const colText = { color: "rgba(0,0,0,0.65)", fontWeight: 700, display: "flex", alignItems: "center" }

const colCompany = { display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }
const companyLine = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }
const companyText = {
  color: "rgba(0,0,0,0.70)",
  fontWeight: 800,
  fontSize: 13,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
}

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
  fontSize: 12,
  whiteSpace: "nowrap"
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

const softGreenPill = {
  background: "rgba(20,92,67,0.10)",
  borderColor: "rgba(20,92,67,0.18)",
  color: "#145c43"
}
