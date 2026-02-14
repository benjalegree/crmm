import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Companies() {
  const nav = useNavigate()

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [q, setQ] = useState("")

  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const safeErr = (data, fallback) =>
    data?.error || data?.details?.error?.message || data?.details?.error || data?.details?.message || fallback

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
      setRecords(data.records || data.records?.records || data.records || data?.records || data?.records || data?.records || (data?.records ?? data?.records) || data?.records || data?.records)
      // fallback real:
      setRecords((data.records || data.records?.records || data.records || data?.records || data?.records || data?.records || data?.records || []) || [])
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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return records
    return (records || []).filter((r) => {
      const f = r?.fields || {}
      const name = String(f["Name"] || f["Company Name"] || f["Company"] || "").toLowerCase()
      const web = String(f["Website"] || f["URL"] || "").toLowerCase()
      const ind = String(f["Industry"] || f["Sector"] || "").toLowerCase()
      return name.includes(term) || web.includes(term) || ind.includes(term)
    })
  }, [records, q])

  return (
    <div style={page}>
      <div style={headerRow}>
        <div>
          <h1 style={title}>Companies</h1>
          <div style={subtitle}>Your assigned companies (clean view + quick actions).</div>
        </div>

        <div style={rightTools}>
          <div style={searchWrap}>
            <input
              style={search}
              placeholder="Search by name, website, industry..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button style={miniBtn} onClick={load} type="button">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={loadingBox}>Loading...</div>
      ) : err ? (
        <div style={errBox}>
          {err}
          <button style={{ ...miniBtn, marginTop: 10 }} onClick={load} type="button">
            Retry
          </button>
        </div>
      ) : (
        <div style={grid}>
          {filtered.map((r) => {
            const f = r.fields || {}
            const name = f["Name"] || f["Company Name"] || f["Company"] || "Company"
            const website = f["Website"] || f["URL"] || ""
            const industry = f["Industry"] || f["Sector"] || ""
            const country = f["Country"] || f["Location"] || ""
            const size = f["Company Size"] || f["Size"] || ""

            return (
              <div key={r.id} style={card}>
                <div style={cardTop}>
                  <div style={{ minWidth: 0 }}>
                    <div style={companyName} title={name}>
                      {name}
                    </div>
                    <div style={metaRow}>
                      {industry ? <span style={pillSoft}>{industry}</span> : null}
                      {country ? <span style={pillSoft}>{country}</span> : null}
                      {size ? <span style={pillSoft}>{size}</span> : null}
                    </div>
                  </div>

                  <div style={actions}>
                    {website ? (
                      <a style={linkBtn} href={website} target="_blank" rel="noreferrer">
                        Website
                      </a>
                    ) : (
                      <span style={ghostPill}>No website</span>
                    )}
                  </div>
                </div>

                <div style={divider} />

                <div style={smallGrid}>
                  <div style={kv}>
                    <div style={k}>Responsible</div>
                    <div style={v}>{String(f["Responsible Email"] || "").toLowerCase()}</div>
                  </div>
                  <div style={kv}>
                    <div style={k}>Notes</div>
                    <div style={v} title={f["Notes"] || ""}>
                      {String(f["Notes"] || "").slice(0, 80) || "—"}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  style={primaryBtn}
                  onClick={() => {
                    // si tenés CompanyProfile route, cambiá esto:
                    // nav(`/companies/${r.id}`)
                    // si no, dejalo como placeholder:
                    nav(`/companies/${r.id}`)
                  }}
                >
                  Open Company
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* styles */
const page = { width: "100%" }

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 14,
  marginBottom: 18
}
const title = { margin: 0, fontSize: 34, fontWeight: 900, letterSpacing: -0.4, color: "#0f3d2e" }
const subtitle = { marginTop: 6, fontSize: 13, color: "rgba(0,0,0,0.55)" }

const rightTools = { display: "flex", gap: 10, alignItems: "center" }
const searchWrap = {
  padding: 10,
  borderRadius: 18,
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(255,255,255,0.55)",
  backdropFilter: "blur(35px)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
}
const search = {
  width: 360,
  maxWidth: "45vw",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 13,
  color: "#0b1f18"
}

const miniBtn = {
  padding: "10px 12px",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.70)",
  backdropFilter: "blur(18px)",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12
}

const loadingBox = {
  padding: 22,
  borderRadius: 22,
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(255,255,255,0.55)",
  backdropFilter: "blur(40px)"
}

const errBox = {
  padding: 18,
  borderRadius: 18,
  background: "rgba(255,0,0,0.08)",
  border: "1px solid rgba(255,0,0,0.12)",
  color: "#7a1d1d"
}

const grid = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }
const card = {
  padding: 18,
  borderRadius: 26,
  background: "rgba(255,255,255,0.52)",
  backdropFilter: "blur(42px)",
  border: "1px solid rgba(255,255,255,0.5)",
  boxShadow: "0 14px 36px rgba(0,0,0,0.07)"
}

const cardTop = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }
const companyName = { fontWeight: 950, color: "#0f3d2e", fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }

const metaRow = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }
const pillSoft = {
  fontSize: 11,
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(20,92,67,0.08)",
  border: "1px solid rgba(20,92,67,0.10)",
  color: "#145c43",
  fontWeight: 900
}

const actions = { display: "flex", gap: 8, alignItems: "center" }
const linkBtn = {
  padding: "8px 10px",
  borderRadius: 14,
  background: "rgba(0,0,0,0.90)",
  color: "#fff",
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 900
}
const ghostPill = {
  padding: "8px 10px",
  borderRadius: 14,
  background: "rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.06)",
  color: "rgba(0,0,0,0.55)",
  fontSize: 12,
  fontWeight: 900
}

const divider = { height: 1, background: "rgba(0,0,0,0.06)", margin: "14px 0" }

const smallGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }
const kv = { minWidth: 0 }
const k = { fontSize: 11, color: "rgba(0,0,0,0.5)", fontWeight: 900 }
const v = { fontSize: 12, color: "rgba(0,0,0,0.85)", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }

const primaryBtn = {
  marginTop: 14,
  width: "100%",
  padding: 12,
  borderRadius: 18,
  border: "none",
  background: "#0b0b0b",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer"
}
