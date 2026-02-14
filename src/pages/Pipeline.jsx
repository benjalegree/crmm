import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Pipeline() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [savingId, setSavingId] = useState("")
  const [leads, setLeads] = useState([])

  const draggingIdRef = useRef("")

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

  const normalizeLead = (record) => {
    if (!record?.fields) return record
    const f = record.fields

    const name =
      f["Full Name"] ||
      f["Name"] ||
      f["Contact Name"] ||
      f["Nombre"] ||
      "Lead"

    // Company puede venir como lookup (nombre), o como array
    const companyName =
      (Array.isArray(f.Company) ? f.Company[0] : f.Company) ||
      f["Company Name"] ||
      f["Company Name (from Company)"] ||
      ""

    const status = f.Status || "Not Contacted"

    return {
      ...record,
      fields: {
        ...f,
        __name: name,
        __companyName: companyName,
        __status: status
      }
    }
  }

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => (document.body.style.overflow = prev)
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

      setLeads((data.records || []).map(normalizeLead))
      setLoading(false)
    } catch {
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
    // orden simple por nombre
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) =>
        String(a.fields?.__name || "").localeCompare(String(b.fields?.__name || ""))
      )
    })
    return map
  }, [leads, STAGES])

  const moveLead = async (leadId, newStatus) => {
    if (!leadId || !newStatus) return
    const current = leads.find((l) => l.id === leadId)
    const oldStatus = current?.fields?.__status || ""
    if (oldStatus === newStatus) return

    // optimistic UI
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, fields: { ...l.fields, Status: newStatus, __status: newStatus } }
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
          fields: { Status: newStatus }
        })
      })

      const data = await readJson(res)

      if (!res.ok) {
        // rollback
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, fields: { ...l.fields, Status: oldStatus, __status: oldStatus } }
              : l
          )
        )
        setSavingId("")
        return
      }
    } catch {
      // rollback
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? { ...l, fields: { ...l.fields, Status: oldStatus, __status: oldStatus } }
            : l
        )
      )
    }

    setSavingId("")
  }

  const onDragStart = (e, leadId) => {
    draggingIdRef.current = leadId
    e.dataTransfer.setData("text/plain", leadId)
    e.dataTransfer.effectAllowed = "move"
  }

  const onDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const onDrop = (e, stageKey) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData("text/plain") || draggingIdRef.current
    draggingIdRef.current = ""
    moveLead(leadId, stageKey)
  }

  const openLead = (id) => navigate(`/leads/${id}`)

  return (
    <div style={page}>
      <div style={bgA} />
      <div style={bgB} />
      <div style={grain} />

      <div style={header}>
        <div>
          <div style={title}>Pipeline</div>
          <div style={sub}>Arrastrá burbujas entre estados • click para abrir el perfil</div>
        </div>

        <button style={refreshBtn} onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div style={errorBox}>
          {error}
          <button style={retryBtn} onClick={load}>Retry</button>
        </div>
      ) : null}

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
                      style={{ ...bubble, ...(saving ? bubbleSaving : null) }}
                      draggable
                      onDragStart={(e) => onDragStart(e, lead.id)}
                      onClick={() => openLead(lead.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && openLead(lead.id)}
                      title="Click para abrir el perfil"
                    >
                      <div style={bubbleName}>{f.__name}</div>
                      <div style={bubbleCompany}>{f.__companyName || "No company"}</div>
                    </div>
                  )
                })}

                {!items.length ? (
                  <div style={empty}>Soltá acá</div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ===================== */
/* STYLES */
/* ===================== */

const page = {
  height: "100vh",
  width: "100%",
  position: "relative",
  overflow: "hidden",
  padding: 18,
  boxSizing: "border-box"
}

const bgA = {
  position: "absolute",
  inset: "-35%",
  background:
    "radial-gradient(circle at 18% 22%, rgba(20,92,67,0.22) 0%, rgba(20,92,67,0.08) 32%, rgba(255,255,255,0) 64%)",
  filter: "blur(18px)",
  pointerEvents: "none"
}

const bgB = {
  position: "absolute",
  inset: "-35%",
  background:
    "radial-gradient(circle at 82% 82%, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.08) 34%, rgba(255,255,255,0) 68%)",
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

const header = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 12,
  marginBottom: 12
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

const refreshBtn = {
  height: 46,
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

const board = {
  position: "relative",
  zIndex: 2,
  height: "calc(100vh - 18px - 18px - 66px)",
  minHeight: 520,

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
  gridAutoColumns: "minmax(260px, 1fr)",
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

/* burbuja simple */
const bubble = {
  borderRadius: 18,
  padding: "12px 12px",
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

const bubbleSaving = {
  opacity: 0.7
}

const bubbleName = {
  fontWeight: 950,
  fontSize: 13,
  color: "rgba(0,0,0,0.78)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const bubbleCompany = {
  marginTop: 4,
  fontWeight: 850,
  fontSize: 12,
  color: "rgba(0,0,0,0.45)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const empty = {
  borderRadius: 18,
  padding: 14,
  background: "rgba(255,255,255,0.35)",
  border: "1px dashed rgba(0,0,0,0.14)",
  color: "rgba(0,0,0,0.45)",
  fontWeight: 900,
  textAlign: "center"
}

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
