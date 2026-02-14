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
    setLeads((prev) =>
      (prev || []).map((l) =>
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

  const onDragStart = (leadId) => setDraggingId(leadId)

  const onDropTo = (status) => {
    if (!draggingId) return
    const lead = leads.find((l) => l.id === draggingId)
    if (!lead) return

    const prevStatus = lead.fields.Status || "Not Contacted"
    if (prevStatus === status) {
      setDraggingId(null)
      return
    }

    patchLeadStatusLocal(draggingId, status)
    updateStatusServer(draggingId, status, prevStatus)
    setDraggingId(null)
  }

  const countByStatus = useMemo(() => {
    const map = {}
    statuses.forEach((s) => (map[s] = 0))
    leads.forEach((l) => {
      const s = l?.fields?.Status || "Not Contacted"
      if (map[s] === undefined) map[s] = 0
      map[s]++
    })
    return map
  }, [leads, statuses])

  return (
    <div style={page}>
      <div style={headerRow}>
        <h1 style={title}>Pipeline</h1>

        <button style={ghostBtn} onClick={loadLeads} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err ? <div style={errBox}>{err}</div> : null}

      {loading ? (
        <div style={loadingBox}>Loading pipeline...</div>
      ) : (
        <div style={board}>
          {statuses.map((status) => (
            <div
              key={status}
              style={column}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropTo(status)}
            >
              <div style={colHeader}>
                <h3 style={colTitle}>{status}</h3>
                <span style={badge}>{countByStatus[status] || 0}</span>
              </div>

              <div style={colBody}>
                {leads
                  .filter((l) => (l.fields.Status || "Not Contacted") === status)
                  .map((lead) => (
                    <div
                      key={lead.id}
                      style={{
                        ...bubble,
                        opacity: updatingId === lead.id ? 0.7 : 1,
                        transform: draggingId === lead.id ? "scale(0.99)" : "scale(1)"
                      }}
                      draggable
                      onDragStart={() => onDragStart(lead.id)}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      title="Click para abrir el perfil"
                    >
                      <div style={bubbleName}>
                        {lead.fields["Full Name"] || "—"}
                      </div>

                      <div style={bubbleMeta}>
                        <span style={metaText}>{lead.fields.Position || "—"}</span>
                        <span style={metaDot}>•</span>
                        <span style={metaText}>
                          {Array.isArray(lead.fields.CompanyName)
                            ? (lead.fields.CompanyName[0] || "—")
                            : (lead.fields.CompanyName || "—")}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ===================== */
/* STYLES (más minimal + “burbujas” grandes verdes) */
/* ===================== */

const page = { width: "100%" }

const headerRow = {
  display: "flex",
  alignItems: "center",
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

const ghostBtn = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.75)",
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
  minWidth: 300,
  borderRadius: 24,
  background: "rgba(255,255,255,0.50)",
  backdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.45)",
  boxShadow: "0 10px 34px rgba(0,0,0,0.05)",
  overflow: "hidden"
}

const colHeader = {
  padding: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid rgba(0,0,0,0.06)"
}

const colTitle = {
  margin: 0,
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: 0.2,
  color: "#145c43"
}

const badge = {
  fontSize: 12,
  fontWeight: 900,
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(20,92,67,0.10)",
  color: "#145c43",
  border: "1px solid rgba(20,92,67,0.14)"
}

const colBody = {
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 12
}

const bubble = {
  padding: "16px 16px",
  borderRadius: 22,
  cursor: "grab",
  userSelect: "none",
  background: "rgba(20,92,67,0.10)",
  border: "1px solid rgba(20,92,67,0.18)",
  boxShadow: "0 10px 22px rgba(0,0,0,0.06)"
}

const bubbleName = {
  fontSize: 14,
  fontWeight: 900,
  color: "#0f3d2e"
}

const bubbleMeta = {
  marginTop: 8,
  display: "flex",
  alignItems: "center",
  gap: 8
}

const metaText = {
  fontSize: 12,
  color: "rgba(0,0,0,0.60)",
  fontWeight: 700,
  maxWidth: 135,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
}

const metaDot = {
  fontSize: 12,
  color: "rgba(0,0,0,0.25)",
  fontWeight: 900
}
