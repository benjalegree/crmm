import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

export default function CompanyProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [company, setCompany] = useState(null)
  const [contacts, setContacts] = useState([])

  const [loadingCompany, setLoadingCompany] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(true)

  const [errCompany, setErrCompany] = useState("")
  const [errContacts, setErrContacts] = useState("")

  // autosave
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const autosaveTimerRef = useRef(null)
  const lastSavedSnapshotRef = useRef("")
  const mountedRef = useRef(true)

  // responsive (sin hacks raros)
  const [isNarrow, setIsNarrow] = useState(false)

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
    const onResize = () => setIsNarrow(window.innerWidth < 920)
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    const c1 = new AbortController()
    const c2 = new AbortController()

    setCompany(null)
    setContacts([])
    setErrCompany("")
    setErrContacts("")
    setDirty(false)
    setSaving(false)
    lastSavedSnapshotRef.current = ""

    loadCompany(c1.signal)
    loadContactsForCompany(c2.signal)

    return () => {
      c1.abort()
      c2.abort()
    }
    // eslint-disable-next-line
  }, [id])

  const loadCompany = async (signal) => {
    setLoadingCompany(true)
    setErrCompany("")
    try {
      const res = await fetch(`/api/crm?action=getCompany&id=${id}`, {
        credentials: "include",
        signal
      })
      const data = await readJson(res)

      if (!mountedRef.current) return

      if (!res.ok) {
        setCompany(null)
        setErrCompany(safeErrMsg(data, "Failed to load company"))
        setLoadingCompany(false)
        return
      }

      setCompany(data)
      setLoadingCompany(false)
      lastSavedSnapshotRef.current = JSON.stringify(data?.fields || {})
    } catch (e) {
      if (!mountedRef.current) return
      if (e?.name === "AbortError") return
      setCompany(null)
      setErrCompany("Failed to load company")
      setLoadingCompany(false)
    }
  }

  const loadContactsForCompany = async (signal) => {
    setLoadingContacts(true)
    setErrContacts("")
    try {
      const res = await fetch(`/api/crm?action=getContacts`, {
        credentials: "include",
        signal
      })
      const data = await readJson(res)

      if (!mountedRef.current) return

      if (!res.ok) {
        setContacts([])
        setErrContacts(safeErrMsg(data, "Failed to load contacts"))
        setLoadingContacts(false)
        return
      }

      const all = data.records || []

      // Contacts.Company suele ser un array con recordIds de Companies
      const filtered = all.filter((c) => {
        const rel = c?.fields?.Company
        return Array.isArray(rel) && rel.includes(id)
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
      setErrContacts("Failed to load contacts")
      setLoadingContacts(false)
    }
  }

  const updateField = (field, value) => {
    setCompany((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        fields: {
          ...(prev.fields || {}),
          [field]: value
        }
      }
    })
    setDirty(true)
    setErrCompany("")
  }

  const computeSnapshot = (fields) => JSON.stringify(fields || {})

  const buildPayload = (fields) => {
    const f = fields || {}
    return {
      id,
      fields: {
        // el backend ya mapea nombres reales si tu base usa "Name" vs "Company Name"
        "Company Name": String(f["Company Name"] || f["Name"] || ""),
        Industry: String(f.Industry || ""),
        Country: String(f.Country || ""),
        Status: String(f.Status || "New"),
        Website: String(f["Website"] || f.URL || ""),
        "Responsible Email": String(f["Responsible Email"] || "")
      }
    }
  }

  const saveNow = async ({ silent = false } = {}) => {
    if (!company?.fields) return

    const currentSnap = computeSnapshot(company.fields)
    if (currentSnap === lastSavedSnapshotRef.current) {
      setDirty(false)
      return
    }

    setSaving(true)
    if (!silent) setErrCompany("")

    try {
      const payload = buildPayload(company.fields)

      const res = await fetch(`/api/crm?action=updateCompany`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      const data = await readJson(res)

      if (!mountedRef.current) return

      if (!res.ok) {
        setErrCompany(safeErrMsg(data, "Failed to update company"))
        setSaving(false)
        return
      }

      lastSavedSnapshotRef.current = computeSnapshot(company.fields)
      setDirty(false)
    } catch {
      if (!mountedRef.current) return
      setErrCompany("Failed to update company")
    }

    if (!mountedRef.current) return
    setSaving(false)
  }

  // autosave debounce
  useEffect(() => {
    if (!dirty) return
    if (!company?.fields) return

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)

    autosaveTimerRef.current = setTimeout(() => {
      saveNow({ silent: true })
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

  if (loadingCompany) return <div style={loadingBox}>Loading...</div>

  if (errCompany) {
    return (
      <div style={page}>
        <div style={topbar}>
          <button style={ghostBtn} type="button" onClick={() => navigate("/companies")}>
            Back
          </button>
          <div style={autosaveInline}>{autosaveText}</div>
          <button
            style={ghostBtn}
            type="button"
            onClick={() => {
              const c1 = new AbortController()
              const c2 = new AbortController()
              loadCompany(c1.signal)
              loadContactsForCompany(c2.signal)
            }}
          >
            Retry
          </button>
        </div>

        <div style={errBox}>{errCompany}</div>
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
  const website = f["Website"] || f.URL || ""

  return (
    <div style={page}>
      {/* Minimal topbar */}
      <div style={topbar}>
        <button style={ghostBtn} type="button" onClick={() => navigate("/companies")}>
          Back
        </button>

        <div style={titleWrap}>
          <h1 style={title}>{name}</h1>
          <div style={metaRow}>
            {f.Status ? (
              <span style={{ ...tag, ...statusColorCompany(f.Status) }}>{f.Status}</span>
            ) : (
              <span style={{ ...tag, ...tagNeutral }}>New</span>
            )}
            <span style={autosaveInline}>{autosaveText}</span>
            {website ? (
              <a href={safeUrl(website)} target="_blank" rel="noreferrer" style={link}>
                Website ↗
              </a>
            ) : null}
          </div>
        </div>

        <button
          style={ghostBtn}
          type="button"
          onClick={() => {
            const c1 = new AbortController()
            const c2 = new AbortController()
            loadCompany(c1.signal)
            loadContactsForCompany(c2.signal)
          }}
        >
          Refresh
        </button>
      </div>

      {errCompany ? <div style={errBox}>{errCompany}</div> : null}

      <div
        style={{
          ...grid,
          gridTemplateColumns: isNarrow ? "1fr" : "1.4fr 1fr"
        }}
      >
        {/* LEFT */}
        <div style={card}>
          <div style={sectionTitle}>Company</div>

          <div
            style={{
              ...form,
              gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr"
            }}
          >
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
                value={f["Website"] || f.URL || ""}
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

          {/* opcional manual (no rompe autosave) */}
          <button type="button" style={primaryBtn} onClick={() => saveNow({ silent: false })} disabled={saving}>
            {saving ? "Saving..." : "Save now"}
          </button>
        </div>

        {/* RIGHT */}
        <div style={card}>
          <div style={sectionTitle}>Contacts</div>

          {errContacts ? <div style={errBox}>{errContacts}</div> : null}

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
                      <div style={rowSub}>{email || "—"}</div>
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
   STYLES
========================= */

const page = {
  width: "100%",
  maxWidth: 1280,
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

const tagNeutral = {
  background: "rgba(0,0,0,0.04)",
  borderColor: "rgba(0,0,0,0.08)",
  color: "rgba(0,0,0,0.70)"
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

const ghostBtn = {
  padding: "12px 14px",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(18px)",
  cursor: "pointer",
  fontWeight: 900
}

const primaryBtn = {
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

const rowTitle = {
  fontWeight: 950,
  color: "rgba(0,0,0,0.82)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
}

const rowSub = {
  marginTop: 6,
  fontSize: 12,
  color: "rgba(0,0,0,0.55)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
}

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
