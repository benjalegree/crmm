import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"

export default function CompanyProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [company, setCompany] = useState(null)
  const [contacts, setContacts] = useState([])

  const [loading, setLoading] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(true)

  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")
  const [contactsErr, setContactsErr] = useState("")

  // autosave
  const [dirty, setDirty] = useState(false)
  const autosaveTimerRef = useRef(null)
  const lastSavedSnapshotRef = useRef("")
  const mountedRef = useRef(true)

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
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    const ctrl2 = new AbortController()

    setCompany(null)
    setContacts([])
    setErr("")
    setContactsErr("")
    setDirty(false)
    lastSavedSnapshotRef.current = ""

    loadCompany(ctrl.signal)
    loadContactsForCompany(ctrl2.signal)

    return () => {
      ctrl.abort()
      ctrl2.abort()
    }
    // eslint-disable-next-line
  }, [id])

  const loadCompany = async (signal) => {
    setLoading(true)
    setErr("")
    try {
      const res = await fetch(`/api/crm?action=getCompany&id=${id}`, {
        credentials: "include",
        signal
      })
      const data = await readJson(res)

      if (!mountedRef.current) return

      if (!res.ok) {
        setCompany(null)
        setErr(safeErrMsg(data, "Failed to load company"))
        setLoading(false)
        return
      }

      setCompany(data)
      setLoading(false)

      lastSavedSnapshotRef.current = JSON.stringify(data?.fields || {})
    } catch (e) {
      if (!mountedRef.current) return
      if (e?.name === "AbortError") return
      setCompany(null)
      setErr("Failed to load company")
      setLoading(false)
    }
  }

  // ✅ muestra contactos asociados: pedimos tus contactos y filtramos por Company recId
  const loadContactsForCompany = async (signal) => {
    setLoadingContacts(true)
    setContactsErr("")
    try {
      const res = await fetch(`/api/crm?action=getContacts`, {
        credentials: "include",
        signal
      })
      const data = await readJson(res)

      if (!mountedRef.current) return

      if (!res.ok) {
        setContacts([])
        setContactsErr(safeErrMsg(data, "Failed to load contacts"))
        setLoadingContacts(false)
        return
      }

      const all = data.records || []

      const filtered = all.filter((c) => {
        const companyArr = c?.fields?.Company
        return Array.isArray(companyArr) && companyArr.includes(id)
      })

      filtered.sort((a, b) => {
        const na = String(a?.fields?.["Full Name"] || a?.fields?.Name || "")
        const nb = String(b?.fields?.["Full Name"] || b?.fields?.Name || "")
        return na.localeCompare(nb)
      })

      setContacts(filtered)
      setLoadingContacts(false)
    } catch (e) {
      if (!mountedRef.current) return
      if (e?.name === "AbortError") return
      setContacts([])
      setContactsErr("Failed to load contacts")
      setLoadingContacts(false)
    }
  }

  const updateField = (field, value) => {
    setCompany((prev) => {
      const next = {
        ...prev,
        fields: {
          ...(prev?.fields || {}),
          [field]: value
        }
      }
      return next
    })
    setDirty(true)
    setErr("")
  }

  const computeSnapshot = (fields) => JSON.stringify(fields || {})

  const buildPayload = (fields) => {
    const f = fields || {}
    const companyName = f["Company Name"] ?? f["Name"] ?? ""

    return {
      id,
      fields: {
        "Company Name": String(companyName || ""),
        Industry: String(f.Industry || ""),
        Country: String(f.Country || ""),
        Status: String(f.Status || "New"),
        Website: String(f.Website || f["Website"] || f.URL || ""),
        "Responsible Email": String(f["Responsible Email"] || "")
      }
    }
  }

  const saveChanges = async ({ silent = false } = {}) => {
    if (!company?.fields) return

    const currentSnap = computeSnapshot(company.fields)
    if (currentSnap === lastSavedSnapshotRef.current) {
      setDirty(false)
      return
    }

    setSaving(true)
    if (!silent) setErr("")

    try {
      const payload = buildPayload(company.fields)

      const res = await fetch("/api/crm?action=updateCompany", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      const data = await readJson(res)

      if (!mountedRef.current) return

      if (!res.ok) {
        setErr(safeErrMsg(data, "Failed to update company"))
        setSaving(false)
        return
      }

      lastSavedSnapshotRef.current = computeSnapshot(company.fields)
      setDirty(false)
    } catch {
      if (!mountedRef.current) return
      setErr("Failed to update company")
    }

    if (!mountedRef.current) return
    setSaving(false)
  }

  // ✅ AUTOSAVE debounce
  useEffect(() => {
    if (!dirty) return
    if (!company?.fields) return

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)

    autosaveTimerRef.current = setTimeout(() => {
      saveChanges({ silent: true })
    }, 600)

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
    // eslint-disable-next-line
  }, [dirty, company?.fields])

  const autosaveText = useMemo(() => {
    if (saving) return "Saving…"
    if (dirty) return "Auto-save on"
    return "Auto-saved"
  }, [saving, dirty])

  if (loading) return <div style={loadingBox}>Loading...</div>

  if (err) {
    return (
      <div style={page}>
        <div style={topbar}>
          <button style={btnGhost} type="button" onClick={() => navigate("/companies")}>
            Back
          </button>
          <div style={autosaveInline}>{autosaveText}</div>
        </div>

        <div style={errBox}>{err}</div>

        <button
          type="button"
          style={btnGhost}
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
  const website = f["Website"] || f.URL || f.Website || ""

  return (
    <div style={page}>
      {/* Minimal topbar */}
      <div style={topbar}>
        <button style={btnGhost} type="button" onClick={() => navigate("/companies")}>
          Back
        </button>

        <div style={titleWrap}>
          <h1 style={title}>{name}</h1>

          <div style={metaRow}>
            {f.Status ? <span style={{ ...tag, ...statusColorCompany(f.Status) }}>{f.Status}</span> : null}
            <span style={autosaveInline}>{autosaveText}</span>

            {website ? (
              <a href={safeUrl(website)} target="_blank" rel="noreferrer" style={link}>
                Website ↗
              </a>
            ) : null}
          </div>
        </div>

        <button
          style={btnGhost}
          type="button"
          onClick={() => {
            const ctrl = new AbortController()
            const ctrl2 = new AbortController()
            loadCompany(ctrl.signal)
            loadContactsForCompany(ctrl2.signal)
          }}
        >
          Refresh
        </button>
      </div>

      {err ? <div style={errBox}>{err}</div> : null}

      {/* Wide layout */}
      <div style={grid}>
        {/* LEFT: company fields */}
        <div style={card}>
          <div style={sectionTitle}>Company</div>

          <div style={form}>
            <Field label="Company Name">
              <input
                style={input}
                value={f["Company Name"] || f["Name"] || ""}
                onChange={(e) => updateField("Company Name", e.target.value)}
              />
            </Field>

            <Field label="Industry">
              <input
                style={input}
                value={f.Industry || ""}
                onChange={(e) => updateField("Industry", e.target.value)}
              />
            </Field>

            <Field label="Country">
              <input
                style={input}
                value={f.Country || ""}
                onChange={(e) => updateField("Country", e.target.value)}
              />
            </Field>

            <Field label="Status">
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
            </Field>

            <Field label="Website">
              <input
                style={input}
                value={f["Website"] || f.URL || f.Website || ""}
                onChange={(e) => updateField("Website", e.target.value)}
                placeholder="https://..."
              />
            </Field>

            <Field label="Responsible Email">
              <input
                style={input}
                value={f["Responsible Email"] || ""}
                onChange={(e) => updateField("Responsible Email", e.target.value)}
                placeholder="owner@company.com"
              />
            </Field>
          </div>

          {/* botón opcional manual (sin sacar autosave) */}
          <button
            type="button"
            style={btnPrimary}
            onClick={() => saveChanges({ silent: false })}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save now"}
          </button>
        </div>

        {/* RIGHT: associated contacts */}
        <div style={card}>
          <div style={sectionTitle}>Contacts</div>

          {contactsErr ? <div style={errBox}>{contactsErr}</div> : null}

          {loadingContacts ? (
            <div style={muted}>Loading contacts…</div>
          ) : !contacts.length ? (
            <div style={muted}>No contacts linked to this company yet.</div>
          ) : (
            <div style={list}>
              {contacts.map((c) => {
                const cf = c.fields || {}
                const fullName = cf["Full Name"] || cf.Name || "Contact"
                const email = cf.Email || ""
                const status = cf.Status || ""
                return (
                  <Link key={c.id} to={`/leads/${c.id}`} style={row}>
                    <div style={{ minWidth: 0 }}>
                      <div style={rowTitle}>{fullName}</div>
                      <div style={rowSub}>
                        {email ? <span>{email}</span> : <span style={{ opacity: 0.7 }}>No email</span>}
                      </div>
                    </div>
                    {status ? <span style={{ ...tag, ...statusColorLead(status) }}>{status}</span> : null}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================
   SMALL COMPONENTS
========================= */

function Field({ label, children }) {
  return (
    <div style={field}>
      <div style={labelStyle}>{label}</div>
      {children}
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
  if (v === "Closed Won") return { background: "rgba(0,200,120,0.12)", borderColor: "rgba(0,200,120,0.20)", color: "#0f5132" }
  if (v === "Closed Lost") return { background: "rgba(255,0,0,0.08)", borderColor: "rgba(255,0,0,0.14)", color: "#7a1d1d" }
  if (v === "Meeting Booked") return { background: "rgba(30,180,90,0.12)", borderColor: "rgba(30,180,90,0.20)", color: "#0f5132" }
  if (v === "Replied") return { background: "rgba(80,70,210,0.10)", borderColor: "rgba(80,70,210,0.18)", color: "#2b2a7a" }
  if (v === "Contacted") return { background: "rgba(20,120,255,0.10)", borderColor: "rgba(20,120,255,0.18)", color: "#0b3a8a" }
  return { background: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.70)" }
}

function statusColorLead(s) {
  const v = String(s || "")
  if (v === "Closed Won") return { background: "rgba(0,200,120,0.12)", borderColor: "rgba(0,200,120,0.20)", color: "#0f5132" }
  if (v === "Closed Lost") return { background: "rgba(255,0,0,0.08)", borderColor: "rgba(255,0,0,0.14)", color: "#7a1d1d" }
  if (v === "Meeting Booked") return { background: "rgba(30,180,90,0.12)", borderColor: "rgba(30,180,90,0.20)", color: "#0f5132" }
  if (v === "Replied") return { background: "rgba(80,70,210,0.10)", borderColor: "rgba(80,70,210,0.18)", color: "#2b2a7a" }
  if (v === "Contacted") return { background: "rgba(20,120,255,0.10)", borderColor: "rgba(20,120,255,0.18)", color: "#0b3a8a" }
  return { background: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.08)", color: "rgba(0,0,0,0.70)" }
}

/* =========================
   STYLES (MINIMAL + WIDE)
========================= */

const page = {
  width: "100%",
  maxWidth: 1200,
  margin: "0 auto"
}

const topbar = {
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  gap: 14,
  marginBottom: 18
}

const titleWrap = { minWidth: 0 }

const title = {
  fontSize: 34,
  fontWeight: 900,
  color: "#0f3d2e",
  margin: 0,
  lineHeight: 1.1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
}

const metaRow = {
  marginTop: 10,
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap"
}

const autosaveInline = {
  fontSize: 12,
  fontWeight: 900,
  color: "rgba(0,0,0,0.45)"
}

const tag = {
  fontSize: 12,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.08)",
  fontWeight: 900,
  whiteSpace: "nowrap"
}

const link = {
  fontSize: 12,
  fontWeight: 900,
  color: "#145c43",
  textDecoration: "none",
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid rgba(20,92,67,0.18)",
  background: "rgba(20,92,67,0.08)"
}

const grid = {
  display: "grid",
  gridTemplateColumns: "1.35fr 1fr",
  gap: 18
}

const card = {
  padding: 18,
  borderRadius: 22,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  border: "1px solid rgba(255,255,255,0.45)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.05)"
}

const sectionTitle = {
  fontSize: 13,
  fontWeight: 950,
  color: "rgba(0,0,0,0.55)",
  marginBottom: 14,
  letterSpacing: 0.2
}

const form = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12
}

const field = { display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }
const labelStyle = { fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.50)" }

const input = {
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.80)",
  outline: "none",
  fontWeight: 800,
  color: "rgba(0,0,0,0.80)"
}

const btnGhost = {
  padding: "12px 14px",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(18px)",
  cursor: "pointer",
  fontWeight: 900
}

const btnPrimary = {
  marginTop: 14,
  padding: "12px 14px",
  borderRadius: 16,
  border: "none",
  background: "#0b0b0b",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
  width: "fit-content"
}

const list = { display: "flex", flexDirection: "column", gap: 10 }
const row = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.65)",
  textDecoration: "none",
  color: "inherit"
}
const rowTitle = { fontWeight: 950, color: "rgba(0,0,0,0.82)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
const rowSub = { marginTop: 6, fontSize: 12, color: "rgba(0,0,0,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }

const muted = { fontSize: 13, color: "rgba(0,0,0,0.55)" }

const errBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)"
}

const loadingBox = { padding: 30 }

/* Responsive (inline): reduce a 1 columna en pantallas chicas */
if (typeof window !== "undefined") {
  const w = window.innerWidth
  if (w && w < 920) {
    grid.gridTemplateColumns = "1fr"
    form.gridTemplateColumns = "1fr"
    topbar.gridTemplateColumns = "auto 1fr"
    topbar.rowGap = 10
  }
}
