import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Pipeline() {
  const navigate = useNavigate()

  const statuses = useMemo(
    () => [
      "Not Contacted",
      "Contacted",
      "Replied",
      "Meeting Booked",
      "Closed Won",
      "Closed Lost"
    ],
    []
  )

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [draggingId, setDraggingId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    loadLeads()
    // eslint-disable-next-line
  }, [])

  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const loadLeads = async () => {
    setLoading(true)
    setErr("")
    try {
      const res = await fetch("/api/crm?action=getContacts", {
        credentials: "include"
      })
      const data = await readJson(res)
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

  const patchLeadStatusLocal = (leadId, newStatus) => {
    setLeads(prev =>
      (prev || []).map(l =>
        l.id === leadId ? { ...l, fields: { ...l.fields, Status: newStatus } } : l
      )
    )
  }

  const updateStatusServer = async (leadId, newStatus, prevStatus) => {
    setUpdatingId(leadId)
    setErr("")
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
        patchLeadStatusLocal(leadId, prevStatus)
        setErr(data?.error || "Failed to update status")
        setUpdatingId(null)
        return
      }
    } catch {
      patchLeadStatusLocal(leadId, prevStatus)
      setErr("Failed to update status")
    }
    setUpdatingId(null)
  }

  const onDragStart = (leadId) => {
    setDraggingId(leadId)
  }

  const onDropTo = (status) => {
    if (!draggingId) return
    const lead = leads.find(l => l.id === draggingId)
    if (!lead) return

    const prevStatus = lead.fields.Status || "Not Contacted"
    if (prevStatus === status) {
      setDraggingId(null)
      return
    }

    // optimistic UI
    patchLeadStatusLocal(draggingId, status)
    updateStatusServer(draggingId, status, prevStatus)
    setDraggingId(null)
  }

  const countByStatus = useMemo(() => {
    const map = {}
    statuses.forEach(s => (map[s] = 0))
    leads.forEach(l => {
      const s = l?.fields?.Status || "Not Contacted"
      if (map[s] === undefined) map[s] = 0
      map[s]++
    })
    return map
  }, [leads, statuses])

  return (
    <div style={page}>
      <div style={headerRow}>
        <div>
          <h1 style={title}>Pipeline</h1>
          <p style={subtitle}>
            Arrastrá un lead a otra columna para cambiar el estado.
          </p>
        </div>

        <button style={ghostBtn} onClick={loadLeads} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err ? <div style={errBox}>{err}</div> : null}

      {loading ? (
        <div style={loadingBox}>Loading pipeline...</div>
      ) : (
        <div style={board}>
          {statuses.map(status => (
            <div
              key={status}
              style={column}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropTo(status)}
            >
              <div style={colHeader}>
                <div style={colTitleRow}>
                  <h3 style={colTitle}>{status}</h3>
                  <span style={badge}>{countByStatus[status] || 0}</span>
                </div>
              </div>

              <div style={colBody}>
                {leads
                  .filter(l => (l.fields.Status || "Not Contacted") === status)
                  .map(lead => (
                    <div
                      key={lead.id}
                      style={{
                        ...card,
                        opacity: updatingId === lead.id ? 0.65 : 1,
                        transform:
                          draggingId === lead.id ? "scale(0.99)" : "scale(1)"
                      }}
                      draggable
                      onDragStart={() => onDragStart(lead.id)}
                      onDoubleClick={() => navigate(`/leads/${lead.id}`)}
                      title="Doble click para abrir el perfil"
                    >
                      <div
                        style={cardTop}
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") navigate(`/leads/${lead.id}`)
                        }}
                      >
                        <strong style={cardName}>
                          {lead.fields["Full Name"] || "—"}
                        </strong>
                        <div style={cardMeta}>
                          <span style={metaText}>{lead.fields.Position || "—"}</span>
                          <span style={metaDot}>•</span>
                          <span style={metaText}>
                            {Array.isArray(lead.fields.CompanyName)
                              ? (lead.fields.CompanyName[0] || "—")
                              : (lead.fields.CompanyName || "—")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                {!leads.some(l => (l.fields.Status || "Not Contacted") === status) ? (
                  <div style={emptyState}>Vacío</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ===================== */
/* STYLES (minimal, “Apple-like”, sin botones extra) */
/* ===================== */

const page = { width: "100%" }

const headerRow = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 18
}

const title = {
  fontSize: 34,
  fontWeight: 800,
  margin: 0,
  color: "#0f3d2e"
}

const subtitle = {
  margin: "6px 0 0 0",
  color: "rgba(0,0,0,0.55)",
  fontSize: 13
}

const ghostBtn = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(16px)",
  cursor: "pointer",
  fontWeight: 800
}

const loadingBox = { padding: 22, color: "rgba(0,0,0,0.6)" }

const errBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)"
}

const board = {
  display: "flex",
  gap: 14,
  marginTop: 18,
  overflowX: "auto",
  paddingBottom: 6
}

const column = {
  minWidth: 280,
  borderRadius: 22,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.45)",
  boxShadow: "0 10px 34px rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
}

const colHeader = {
  padding: 14,
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.45))"
}

const colTitleRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
}

const colTitle = {
  margin: 0,
  fontSize: 14,
  fontWeight: 900,
  color: "#145c43"
}

const badge = {
  fontSize: 12,
  fontWeight: 900,
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(0,0,0,0.06)",
  color: "rgba(0,0,0,0.75)"
}

const colBody = {
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 10
}

const card = {
  borderRadius: 18,
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 10px 22px rgba(0,0,0,0.06)"
}

const cardTop = {
  padding: 12,
  cursor: "pointer"
}

const cardName = {
  display: "block",
  fontSize: 13,
  fontWeight: 900,
  color: "rgba(0,0,0,0.85)"
}

const cardMeta = {
  marginTop: 6,
  display: "flex",
  alignItems: "center",
  gap: 8
}

const metaText = {
  fontSize: 12,
  color: "rgba(0,0,0,0.60)",
  fontWeight: 700,
  maxWidth: 120,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
}

const metaDot = {
  fontSize: 12,
  color: "rgba(0,0,0,0.25)",
  fontWeight: 900
}

const emptyState = {
  padding: 12,
  borderRadius: 16,
  border: "1px dashed rgba(0,0,0,0.14)",
  background: "rgba(255,255,255,0.55)",
  color: "rgba(0,0,0,0.45)",
  fontSize: 12,
  fontWeight: 800,
  textAlign: "center"
}
