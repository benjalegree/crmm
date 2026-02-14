import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Pipeline() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState("")
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [leads, setLeads] = useState([])

  const draggingIdRef = useRef("")
  const toastTimer = useRef(null)

  // Estados del pipeline (ajustá nombres EXACTOS a tus options de Airtable si querés)
  const STAGES = useMemo(
    () => [
      { key: "Not Contacted", title: "Not Contacted" },
      { key: "Contacted", title: "Contacted" },
      { key: "Replied", title: "Replied" },
      { key: "Meeting Booked", title: "Meeting Booked" },
      { key: "Closed Won", title: "Closed Won" },
      { key: "Closed Lost", title: "Closed Lost" }
    ],
    []
  )

  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const safeErrMsg = (data, fallback) => {
    return (
      data?.error ||
      data?.details?.error?.message ||
      data?.details?.error ||
      data?.details?.message ||
      fallback
    )
  }

  const showToast = (msg) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(""), 2200)
  }

  const normalizeContact = (record) => {
    if (!record?.fields) return record
    const f = record.fields

    const name =
      f["Full Name"] ||
      f["Name"] ||
      f["Contact Name"] ||
      f["Nombre"] ||
      "Lead"

    const companyName =
      (Array.isArray(f.Company) ? f.Company[0] : f.Company) || // si es lookup nombre
      f["Company Name"] ||
      f["Company Name (from Company)"] ||
      ""

    const position = f.Position || f.Cargo || f.Puesto || ""

    const email = f.Email || ""
    const phone =
      f.Phone ||
      f["Numero de telefono"] ||
      f["Número de teléfono"] ||
      f["Telefono"] ||
      f["Teléfono"] ||
      ""

    const linkedin = f["LinkedIn URL"] || f.LinkedIn || f.Linkedin || ""
    const website = f.CompanyWebsite || f.Website || ""

    const status = f.Status || "Not Contacted"

    const lastActivity =
      f["Last Activity Date"] ||
      f["Last Activity"] ||
      ""

    const nextFollowUp =
      f["Next Follow-up Date"] ||
      f["Next Follow up"] ||
      ""

    return {
      ...record,
      fields: {
        ...f,
        __name: name,
        __companyName: companyName,
        __position: position,
        __email: email,
        __phone: phone,
        __linkedin: linkedin,
        __website: website,
        __status: status,
        __lastActivity: lastActivity,
        __nextFollowUp: nextFollowUp
      }
    }
  }

  const formatDate = (val) => {
    if (!val) return ""
    const s = String(val).trim()
    if (s.length >= 10 && s[4] === "-" && s[7] === "-") return s.slice(0, 10)
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) return ""
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line
  }, [])

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/crm?action=getContacts", {
        credentials: "include"
      })
      const data = await readJson(res)

      if (!res.ok) {
        setError(safeErrMsg(data, "Failed to load contacts"))
        setLeads([])
        setLoading(false)
        return
      }

      const normalized = (data.records || []).map(normalizeContact)
      setLeads(normalized)
      setLoading(false)
    } catch (e) {
      setError("Failed to load contacts")
      setLeads([])
      setLoading(false)
    }
  }

  const grouped = useMemo(() => {
    const map = {}
    for (const s of STAGES) map[s.key] = []
    for (const lead of leads) {
      const st = lead?.fields?.__status || "Not Contacted"
      if (!map[st]) map[st] = []
      map[st].push(lead)
    }
    // orden dentro de columnas: primero con next follow-up, luego nombre
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        const an = a.fields?.__nextFollowUp ? 0 : 1
        const bn = b.fields?.__nextFollowUp ? 0 : 1
        if (an !== bn) return an - bn
        return String(a.fields?.__name || "").localeCompare(String(b.fields?.__name || ""))
      })
    })
    return map
  }, [leads, STAGES])

  const moveLead = async (leadId, newStatus) => {
    if (!leadId || !newStatus) return

    const current = leads.find((l) => l.id === leadId)
    const oldStatus = current?.fields?.__status || ""

    if (oldStatus === newStatus) return

    // optimistic
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              fields: {
                ...l.fields,
                Status: newStatus,
                __status: newStatus
              }
            }
          : l
      )
    )

    setSavingId(leadId)

    try {
      const res = await fetch("/api/crm?action=updateContact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: leadId,
          fields: {
            Status: newStatus
          }
        })
      })

      const data = await readJson(res)

      if (!res.ok) {
        // rollback
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  fields: {
                    ...l.fields,
                    Status: oldStatus,
                    __status: oldStatus
                  }
                }
              : l
          )
        )
        showToast(safeErrMsg(data, "Failed to update status"))
        setSavingId("")
        return
      }

      showToast("Estado actualizado ✅")
    } catch {
      // rollback
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                fields: {
                  ...l.fields,
                  Status: oldStatus,
                  __status: oldStatus
                }
              }
            : l
        )
      )
      showToast("Server error")
    }

    setSavingId("")
  }

  const onDragStart = (e, leadId) => {
    draggingIdRef.current = leadId
    e.dataTransfer.setData("text/plain", leadId)
    e.dataTransfer.effectAllowed = "move"
  }

  const onDrop = (e, stageKey) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData("text/plain") || draggingIdRef.current
    draggingIdRef.current = ""
    moveLead(leadId, stageKey)
  }

  const onDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const openLead = (leadId) => {
    navigate(`/leads/${leadId}`)
  }

  const totals = useMemo(() => {
    const total = leads.length
    const active = leads.filter((l) => (l.fields?.__status || "") !== "Closed Lost").length
    const meetings = leads.filter((l) => (l.fields?.__status || "") === "Meeting Booked").length
    const won = leads.filter((l) => (l.fields?.__status || "") === "Closed Won").length
    return { total, active, meetings, won }
  }, [leads])

  return (
    <div style={page}>
      <div style={bgA} />
      <div style={bgB} />
      <div style={grain} />

      {/* HEADER */}
      <div style={header}>
        <div>
          <div style={title}>Pipeline</div>
          <div style={sub}>
            Drag & drop leads between stages • click a card to open Lead Profile
          </div>
        </div>

        <div style={kpis}>
          <div style={kpiCard}>
            <div style={kpiLabel}>Total</div>
            <div style={kpiValue}>{totals.total}</div>
          </div>
          <div style={kpiCard}>
            <div style={kpiLabel}>Active</div>
            <div style={kpiValue}>{totals.active}</div>
          </div>
          <div style={kpiCard}>
            <div style={kpiLabel}>Meetings</div>
            <div style={kpiValue}>{totals.meetings}</div>
          </div>
          <div style={kpiCard}>
            <div style={kpiLabel}>Won</div>
            <div style={kpiValue}>{totals.won}</div>
          </div>

          <button type="button" style={refreshBtn} onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div style={errorBox}>
          {error}
          <button type="button" style={retryBtn} onClick={load}>
            Retry
          </button>
        </div>
      ) : null}

      {/* BOARD */}
      <div style={boardWrap}>
        <div style={board}>
          {STAGES.map((stage) => {
            const items = grouped[stage.key] || []
            return (
              <div
                key={stage.key}
                style={col}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, stage.key)}
              >
                <div style={colHeader}>
                  <div style={colTitle}>{stage.title}</div>
                  <div style={colCount}>{items.length}</div>
                </div>

                <div style={colBody}>
                  {items.map((lead) => {
                    const f = lead.fields || {}
                    const saving = savingId === lead.id

                    return (
                      <div
                        key={lead.id}
                        style={{
                          ...card,
                          ...(saving ? cardSaving : null)
                        }}
                        draggable
                        onDragStart={(e) => onDragStart(e, lead.id)}
                        onClick={() => openLead(lead.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") openLead(lead.id)
                        }}
                      >
                        <div style={cardTop}>
                          <div style={nameRow}>
                            <div style={avatar} />
                            <div style={{ minWidth: 0 }}>
                              <div style={leadName} title={f.__name}>
                                {f.__name}
                              </div>
                              <div style={leadMeta} title={f.__position}>
                                {f.__position || "—"}
                              </div>
                            </div>
                          </div>

                          <div style={miniPill}>{f.__status}</div>
                        </div>

                        <div style={companyRow}>
                          <span style={dot} />
                          <span style={companyName} title={f.__companyName}>
                            {f.__companyName || "No company"}
                          </span>
                        </div>

                        <div style={miniGrid}>
                          <div style={miniItem}>
                            <div style={miniLabel}>Email</div>
                            <div style={miniValue} title={f.__email}>
                              {f.__email || "—"}
                            </div>
                          </div>

                          <div style={miniItem}>
                            <div style={miniLabel}>Phone</div>
                            <div style={miniValue} title={f.__phone}>
                              {f.__phone || "—"}
                            </div>
                          </div>

                          <div style={miniItem}>
                            <div style={miniLabel}>Next FU</div>
                            <div style={miniValue}>
                              {formatDate(f.__nextFollowUp) || "—"}
                            </div>
                          </div>

                          <div style={miniItem}>
                            <div style={miniLabel}>Last</div>
                            <div style={miniValue}>
                              {formatDate(f.__lastActivity) || "—"}
                            </div>
                          </div>
                        </div>

                        <div style={cardFooter}>
                          <div style={links}>
                            {f.__linkedin ? (
                              <a
                                href={f.__linkedin}
                                target="_blank"
                                rel="noreferrer"
                                style={link}
                                onClick={(e) => e.stopPropagation()}
                              >
                                LinkedIn
                              </a>
                            ) : (
                              <span style={linkMuted}>LinkedIn</span>
                            )}

                            {f.__website ? (
                              <a
                                href={f.__website}
                                target="_blank"
                                rel="noreferrer"
                                style={link}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Website
                              </a>
                            ) : (
                              <span style={linkMuted}>Website</span>
                            )}
                          </div>

                          <div style={openHint}>
                            {saving ? "Saving..." : "Open"}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {!items.length ? (
                    <div style={empty}>
                      Drop leads here
                      <div style={emptySub}>or drag from another stage</div>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {toast ? <div style={toastBox}>{toast}</div> : null}
    </div>
  )
}

/* =======================
   STYLES (white + english green + glass)
======================= */

const page = {
  height: "100%",
  width: "100%",
  minHeight: "calc(100vh - 0px)",
  position: "relative",
  overflow: "hidden",
  padding: 18,
  boxSizing: "border-box"
}

const bgA = {
  position: "absolute",
  inset: "-30%",
  background:
    "radial-gradient(circle at 18% 22%, rgba(20,92,67,0.20) 0%, rgba(20,92,67,0.08) 28%, rgba(255,255,255,0) 62%)",
  filter: "blur(18px)",
  pointerEvents: "none"
}

const bgB = {
  position: "absolute",
  inset: "-35%",
  background:
    "radial-gradient(circle at 80% 82%, rgba(16,185,129,0.20) 0%, rgba(16,185,129,0.10) 30%, rgba(255,255,255,0) 64%)",
  filter: "blur(22px)",
  pointerEvents: "none"
}

const grain = {
  position: "absolute",
  inset: 0,
  backgroundImage: "radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)",
  backgroundSize: "6px 6px",
  opacity: 0.35,
  mixBlendMode: "soft-light",
  pointerEvents: "none"
}

/* header */
const header = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 16,
  marginBottom: 14
}

const title = {
  fontSize: 34,
  fontWeight: 950,
  letterSpacing: -0.8,
  color: "rgba(0,0,0,0.82)"
}

const sub = {
  marginTop: 6,
  fontSize: 13,
  fontWeight: 850,
  color: "rgba(0,0,0,0.45)"
}

const kpis = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end"
}

const kpiCard = {
  minWidth: 96,
  height: 54,
  borderRadius: 16,
  padding: "10px 12px",
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(0,0,0,0.06)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  boxShadow: "0 14px 30px rgba(0,0,0,0.10)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center"
}

const kpiLabel = { fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.45)" }
const kpiValue = { fontSize: 18, fontWeight: 950, color: "rgba(0,0,0,0.78)" }

const refreshBtn = {
  height: 54,
  padding: "0 14px",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.60)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(0,0,0,0.10)"
}

/* board */
const boardWrap = {
  position: "relative",
  zIndex: 2,
  height: "calc(100vh - 18px - 18px - 84px - 14px)", // padding - header - gap
  minHeight: 520
}

const board = {
  height: "100%",
  borderRadius: 22,
  background: "rgba(255,255,255,0.45)",
  border: "1px solid rgba(0,0,0,0.06)",
  backdropFilter: "blur(26px)",
  WebkitBackdropFilter: "blur(26px)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.10)",
  padding: 14,
  overflow: "hidden",

  display: "grid",
  gridAutoFlow: "column",
  gridAutoColumns: "minmax(280px, 1fr)",
  gap: 12
}

const col = {
  borderRadius: 20,
  background: "rgba(255,255,255,0.35)",
  border: "1px solid rgba(0,0,0,0.05)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  minWidth: 0
}

const colHeader = {
  padding: "12px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  background: "rgba(255,255,255,0.30)"
}

const colTitle = {
  fontWeight: 950,
  fontSize: 13,
  color: "rgba(0,0,0,0.70)"
}

const colCount = {
  minWidth: 30,
  height: 26,
  padding: "0 10px",
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(20,92,67,0.14)",
  border: "1px solid rgba(20,92,67,0.14)",
  color: "rgba(0,0,0,0.70)",
  fontWeight: 950,
  fontSize: 12
}

const colBody = {
  padding: 12,
  overflowY: "auto",
  scrollbarWidth: "thin"
}

/* cards */
const card = {
  borderRadius: 18,
  padding: 12,
  marginBottom: 10,
  cursor: "pointer",
  userSelect: "none",

  background: "rgba(255,255,255,0.62)",
  border: "1px solid rgba(0,0,0,0.06)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  boxShadow: "0 12px 26px rgba(0,0,0,0.08)",
  transition: "transform 120ms ease, box-shadow 120ms ease"
}

const cardSaving = {
  opacity: 0.75,
  transform: "scale(0.995)"
}

const cardTop = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 10
}

const nameRow = { display: "flex", alignItems: "center", gap: 10, minWidth: 0 }
const avatar = {
  width: 34,
  height: 34,
  borderRadius: 14,
  background: "linear-gradient(180deg, rgba(20,92,67,1) 0%, rgba(16,185,129,1) 100%)",
  boxShadow: "0 12px 24px rgba(16,185,129,0.18)",
  flex: "0 0 auto"
}

const leadName = {
  fontWeight: 950,
  fontSize: 13,
  color: "rgba(0,0,0,0.78)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 220
}

const leadMeta = {
  marginTop: 3,
  fontWeight: 850,
  fontSize: 12,
  color: "rgba(0,0,0,0.45)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 220
}

const miniPill = {
  fontSize: 11,
  fontWeight: 950,
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(0,0,0,0.06)",
  color: "rgba(0,0,0,0.65)",
  border: "1px solid rgba(0,0,0,0.06)",
  whiteSpace: "nowrap"
}

const companyRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 10
}

const dot = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "rgba(20,92,67,0.85)"
}

const companyName = {
  fontSize: 12,
  fontWeight: 900,
  color: "rgba(0,0,0,0.62)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const miniGrid = {
  marginTop: 10,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10
}

const miniItem = {
  borderRadius: 14,
  padding: 10,
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(0,0,0,0.05)"
}

const miniLabel = { fontSize: 11, fontWeight: 950, color: "rgba(0,0,0,0.45)" }
const miniValue = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 900,
  color: "rgba(0,0,0,0.72)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const cardFooter = {
  marginTop: 10,
  paddingTop: 10,
  borderTop: "1px solid rgba(0,0,0,0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
}

const links = { display: "flex", alignItems: "center", gap: 10 }
const link = {
  fontSize: 12,
  fontWeight: 950,
  color: "rgba(20,92,67,0.95)",
  textDecoration: "none",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(20,92,67,0.10)",
  border: "1px solid rgba(20,92,67,0.12)"
}
const linkMuted = {
  fontSize: 12,
  fontWeight: 900,
  color: "rgba(0,0,0,0.35)",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(0,0,0,0.05)",
  border: "1px solid rgba(0,0,0,0.05)"
}

const openHint = {
  fontSize: 12,
  fontWeight: 950,
  color: "rgba(0,0,0,0.45)"
}

/* empty */
const empty = {
  borderRadius: 18,
  padding: 14,
  background: "rgba(255,255,255,0.35)",
  border: "1px dashed rgba(0,0,0,0.14)",
  color: "rgba(0,0,0,0.50)",
  fontWeight: 950,
  textAlign: "center"
}
const emptySub = { marginTop: 6, fontSize: 12, color: "rgba(0,0,0,0.40)", fontWeight: 850 }

/* error */
const errorBox = {
  position: "relative",
  zIndex: 2,
  marginBottom: 12,
  padding: 12,
  borderRadius: 16,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
}

const retryBtn = {
  height: 40,
  padding: "0 14px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.75)",
  fontWeight: 950,
  cursor: "pointer"
}

/* toast */
const toastBox = {
  position: "fixed",
  left: "50%",
  bottom: 18,
  transform: "translateX(-50%)",
  zIndex: 9999,
  padding: "12px 14px",
  borderRadius: 16,
  background: "rgba(0,0,0,0.78)",
  color: "#fff",
  fontWeight: 950,
  fontSize: 13,
  boxShadow: "0 20px 40px rgba(0,0,0,0.25)"
}
