import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

export default function CompanyProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")
  const [msg, setMsg] = useState("")

  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const safeErrMsg = (data, fallback) =>
    data?.error ||
    data?.details?.error?.message ||
    data?.details?.error ||
    data?.details?.message ||
    fallback

  useEffect(() => {
    const ctrl = new AbortController()
    loadCompany(ctrl.signal)
    return () => ctrl.abort()
    // eslint-disable-next-line
  }, [id])

  const loadCompany = async (signal) => {
    setLoading(true)
    setErr("")
    setMsg("")
    try {
      const res = await fetch(`/api/crm?action=getCompany&id=${id}`, {
        credentials: "include",
        signal
      })
      const data = await readJson(res)

      if (!res.ok) {
        setCompany(null)
        setErr(safeErrMsg(data, "Failed to load company"))
        setLoading(false)
        return
      }

      setCompany(data)
      setLoading(false)
    } catch (e) {
      if (e?.name === "AbortError") return
      setCompany(null)
      setErr("Failed to load company")
      setLoading(false)
    }
  }

  const updateField = (field, value) => {
    setCompany((prev) => ({
      ...prev,
      fields: {
        ...(prev?.fields || {}),
        [field]: value
      }
    }))
  }

  const saveChanges = async () => {
    if (!company?.fields) return
    setSaving(true)
    setErr("")
    setMsg("")

    try {
      const payload = {
        id,
        fields: {
          "Company Name": company.fields["Company Name"] || company.fields["Name"] || "",
          Industry: company.fields.Industry || "",
          Country: company.fields.Country || "",
          Status: company.fields.Status || "New",
          "Responsible Email": company.fields["Responsible Email"] || ""
        }
      }

      const res = await fetch("/api/crm?action=updateCompany", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      const data = await readJson(res)

      if (!res.ok) {
        setErr(safeErrMsg(data, "Failed to update company"))
        setSaving(false)
        return
      }

      setMsg("Saved ✅")
      const ctrl = new AbortController()
      await loadCompany(ctrl.signal)
    } catch {
      setErr("Failed to update company")
    }

    setSaving(false)
  }

  if (loading) return <div style={loadingBox}>Loading...</div>

  if (err) {
    return (
      <div style={page}>
        <div style={head}>
          <div>
            <h1 style={title}>Company</h1>
            <p style={subtitle}>Profile</p>
          </div>

          <button style={ghostBtn} type="button" onClick={() => navigate("/companies")}>
            Back
          </button>
        </div>

        <div style={errBox}>{err}</div>

        <button
          type="button"
          style={miniBtn}
          onClick={() => {
            const ctrl = new AbortController()
            loadCompany(ctrl.signal)
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!company?.fields) {
    return (
      <div style={page}>
        <div style={errBox}>Company not found</div>
      </div>
    )
  }

  const f = company.fields
  const name = f["Company Name"] || f["Name"] || "Company"
  const website = f["Website"] || f["URL"] || ""

  return (
    <div style={page}>
      <div style={head}>
        <div style={{ minWidth: 0 }}>
          <div style={crumbs}>
            <button style={crumbBtn} onClick={() => navigate("/companies")} type="button">
              Companies
            </button>
            <span style={crumbSep}>/</span>
            <span style={crumbCurrent}>{name}</span>
          </div>

          <div style={heroLine}>
            <h1 style={title}>{name}</h1>
            <div style={topRight}>
              {f.Status ? (
                <span style={{ ...statusPill, ...statusColorCompany(f.Status) }}>{f.Status}</span>
              ) : null}
            </div>
          </div>

          <div style={subLine}>
            <span style={subPill}>{f.Industry || "—"}</span>
            <span style={subDot}>•</span>
            <span style={subPill}>{f.Country || "—"}</span>

            {website ? (
              <>
                <span style={subDot}>•</span>
                <a href={safeUrl(website)} target="_blank" rel="noreferrer" style={subLink}>
                  Website ↗
                </a>
              </>
            ) : null}
          </div>
        </div>

        <div style={headActions}>
          <button style={ghostBtn} type="button" onClick={saveChanges} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            style={ghostBtn}
            type="button"
            onClick={() => {
              const ctrl = new AbortController()
              loadCompany(ctrl.signal)
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {msg ? <div style={okBox}>{msg}</div> : null}
      {err ? <div style={errBox}>{err}</div> : null}

      <div style={gridOne}>
        <div style={card}>
          <div style={cardHeader}>
            <h3 style={h3}>Company Info</h3>
            <span style={hint}>Edit fields and save</span>
          </div>

          <div style={formGrid}>
            <div style={{ ...field, gridColumn: "1 / -1" }}>
              <label style={label}>Company Name</label>
              <input
                style={input}
                value={f["Company Name"] || f["Name"] || ""}
                onChange={(e) => updateField("Company Name", e.target.value)}
              />
            </div>

            <div style={field}>
              <label style={label}>Industry</label>
              <input
                style={input}
                value={f.Industry || ""}
                onChange={(e) => updateField("Industry", e.target.value)}
              />
            </div>

            <div style={field}>
              <label style={label}>Country</label>
              <input
                style={input}
                value={f.Country || ""}
                onChange={(e) => updateField("Country", e.target.value)}
              />
            </div>

            <div style={field}>
              <label style={label}>Status</label>
              <select
                style={input}
                value={f.Status || "New"}
                onChange={(e) => updateField("Status", e.target.value)}
              >
                <option>New</option>
                <option>Contacted</option>
                <option>Replied</option>
                <option>Meeting Booked</option>
                <option>Closed Won</option>
                <option>Closed Lost</option>
              </select>
            </div>

            <div style={field}>
              <label style={label}>Responsible Email</label>
              <input
                style={input}
                value={f["Responsible Email"] || ""}
                onChange={(e) => updateField("Responsible Email", e.target.value)}
                placeholder="owner@company.com"
              />
            </div>

            {website ? (
              <div style={{ ...field, gridColumn: "1 / -1" }}>
                <label style={label}>Website</label>
                <a style={siteBtn} href={safeUrl(website)} target="_blank" rel="noreferrer">
                  Open website ↗
                </a>
              </div>
            ) : null}
          </div>

          <button type="button" style={btn} onClick={saveChanges} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================
   HELPERS
========================= */

function safeUrl(url) {
  const s = String(url || "").trim()
  if (!s) return "#"
  if (s.startsWith("http://") || s.startsWith("https://")) return s
  return `https://${s}`
}

function statusColorCompany(s) {
  const v = String(s || "")
  if (v === "Closed Won") return { background: "rgba(0,200,120,0.18)", borderColor: "rgba(0,200,120,0.35)", color: "#0f5132" }
  if (v === "Closed Lost") return { background: "rgba(255,0,0,0.10)", borderColor: "rgba(255,0,0,0.18)", color: "#7a1d1d" }
  if (v === "Meeting Booked") return { background: "rgba(30,180,90,0.18)", borderColor: "rgba(30,180,90,0.35)", color: "#0f5132" }
  if (v === "Replied") return { background: "rgba(80,70,210,0.16)", borderColor: "rgba(80,70,210,0.30)", color: "#2b2a7a" }
  if (v === "Contacted") return { background: "rgba(20,120,255,0.14)", borderColor: "rgba(20,120,255,0.26)", color: "#0b3a8a" }
  return { background: "rgba(0,0,0,0.06)", borderColor: "rgba(0,0,0,0.10)", color: "rgba(0,0,0,0.70)" }
}

/* =========================
   STYLES (UNIFICADOS CON TU UI)
========================= */

const page = { width: "100%" }

const head = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 14
}

const headActions = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }

const crumbs = { display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }
const crumbBtn = {
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontWeight: 900,
  color: "rgba(0,0,0,0.55)"
}
const crumbSep = { color: "rgba(0,0,0,0.25)", fontWeight: 900 }
const crumbCurrent = { fontWeight: 950, color: "#0f3d2e" }

const heroLine = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }

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

const topRight = { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }

const subLine = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }
const subDot = { color: "rgba(0,0,0,0.20)", fontWeight: 900 }
const subPill = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(0,0,0,0.06)",
  fontWeight: 900,
  color: "rgba(0,0,0,0.70)"
}
const subLink = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(20,92,67,0.10)",
  border: "1px solid rgba(20,92,67,0.18)",
  fontWeight: 900,
  color: "#145c43",
  textDecoration: "none"
}

const gridOne = { display: "grid", gridTemplateColumns: "1fr", gap: 26, maxWidth: 820 }

const card = {
  padding: 22,
  borderRadius: 26,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.45)",
  boxShadow: "0 12px 36px rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 14
}

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 12,
  flexWrap: "wrap"
}

const h3 = { margin: 0, fontSize: 18, fontWeight: 950, color: "#145c43" }
const hint = { fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.50)" }

const formGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12
}

const field = { display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }

const label = { fontSize: 12, color: "rgba(0,0,0,0.6)", fontWeight: 900 }

const input = {
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.80)",
  outline: "none",
  fontWeight: 800,
  color: "rgba(0,0,0,0.80)"
}

const btn = {
  marginTop: 4,
  padding: 14,
  borderRadius: 18,
  border: "none",
  background: "#0b0b0b",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer"
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
  padding: "10px 12px",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.70)",
  backdropFilter: "blur(18px)",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12
}

const statusPill = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.10)",
  fontWeight: 950,
  fontSize: 12,
  whiteSpace: "nowrap"
}

const errBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)"
}

const okBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(0,200,120,0.10)",
  color: "#0f5132",
  border: "1px solid rgba(0,200,120,0.16)"
}

const loadingBox = { padding: 30 }

const siteBtn = {
  width: "fit-content",
  padding: "10px 12px",
  borderRadius: 16,
  border: "1px solid rgba(20,92,67,0.20)",
  background: "rgba(20,92,67,0.10)",
  color: "#145c43",
  fontWeight: 950,
  textDecoration: "none"
}
