import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Pipeline() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [updatingId, setUpdatingId] = useState(null)

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

  useEffect(() => {
    loadLeads()
    // eslint-disable-next-line
  }, [])

  const loadLeads = async () => {
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
    } catch (e) {
      setErr("Failed to load leads")
      setLeads([])
      setLoading(false)
    }
  }

  const updateStatus = async (leadId, newStatus) => {
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

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(data?.error || "Failed to update status")
        setUpdatingId(null)
        return
      }

      // ✅ Optimistic update
      setLeads(prev =>
        (prev || []).map(l =>
          l.id === leadId
            ? { ...l, fields: { ...l.fields, Status: newStatus } }
            : l
        )
      )
    } catch (e) {
      setErr("Failed to update status")
    }
    setUpdatingId(null)
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
            Gestión rápida por estado · Click en un lead para ver perfil
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
            <div key={status} style={column}>
              <div style={colHeader}>
                <div style={colTitleRow}>
                  <h3 style={colTitle}>{status}</h3>
                  <span style={badge}>{countByStatus[status] || 0}</span>
                </div>
                <div style={colHint}>Drag & drop lo hacemos después</div>
              </div>

              <div style={colBody}>
                {leads
                  .filter(lead => (lead.fields.Status || "Not Contacted") === status)
                  .map(lead => (
                    <div key={lead.id} style={card}>
                      <div
                        style={cardTop}
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === "Enter") navigate(`/leads/${lead.id}`)
                        }}
                      >
                        <div style={cardNameRow}>
                          <strong style={cardName}>
                            {lead.fields["Full Name"] || "—"}
                          </strong>
                          <span style={pillFor(status)}>{status}</span>
                        </div>

                        <div style={cardMeta}>
                          <div style={metaLine}>
                            <span style={metaLabel}>Role</span>
                            <span style={metaValue}>
                              {lead.fields.Position || "—"}
                            </span>
                          </div>

                          <div style={metaLine}>
                            <span style={metaLabel}>Company</span>
                            <span style={metaValue}>
                              {Array.isArray(lead.fields.CompanyName)
                                ? (lead.fields.CompanyName[0] || "—")
                                : (lead.fields.CompanyName || "—")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={cardBottom}>
                        <select
                          style={{
                            ...select,
                            opacity: updatingId === lead.id ? 0.65 : 1
                          }}
                          value={lead.fields.Status || "Not Contacted"}
                          onChange={e => updateStatus(lead.id, e.target.value)}
                          disabled={updatingId === lead.id}
                        >
                          {statuses.map(s => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>

                        <button
                          style={miniBtn}
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))}

                {!leads.some(l => (l.fields.Status || "Not Contacted") === status) ? (
                  <div style={emptyState}>
                    <div style={emptyTitle}>Nada acá</div>
                    <div style={emptyText}>Mové un lead a este estado.</div>
                  </div>
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
/* STYLES (mismo look “glass” del CRM) */
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
  gap: 18,
  marginTop: 18,
  overflowX: "auto",
  paddingBottom: 6
}

const column = {
  minWidth: 320,
  borderRadius: 26,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.45)",
  boxShadow: "0 10px 34px rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
}

const colHeader = {
  padding: 18,
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
  fontSize: 16,
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

const colHint = {
  marginTop: 8,
  fontSize: 12,
  color: "rgba(0,0,0,0.45)"
}

const colBody = {
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 12
}

const card = {
  borderRadius: 20,
  background: "rgba(255,255,255,0.75)",
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
  overflow: "hidden"
}

const cardTop = {
  padding: 14,
  cursor: "pointer"
}

const cardNameRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
}

const cardName = {
  fontSize: 14,
  fontWeight: 900,
  color: "rgba(0,0,0,0.85)"
}

const pillFor = (status) => {
  const map = {
    "Not Contacted": "rgba(0,0,0,0.08)",
    "Contacted": "rgba(255,149,0,0.16)",
    "Replied": "rgba(88,86,214,0.16)",
    "Meeting Booked": "rgba(52,199,89,0.16)",
    "Closed Won": "rgba(48,209,88,0.16)",
    "Closed Lost": "rgba(255,59,48,0.16)"
  }
  return {
    fontSize: 11,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    background: map[status] || "rgba(0,0,0,0.08)",
    color: "rgba(0,0,0,0.75)"
  }
}

const cardMeta = {
  marginTop: 10,
  display: "flex",
  flexDirection: "column",
  gap: 6
}

const metaLine = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
}

const metaLabel = {
  fontSize: 11,
  color: "rgba(0,0,0,0.45)",
  fontWeight: 800
}

const metaValue = {
  fontSize: 12,
  color: "rgba(0,0,0,0.75)",
  fontWeight: 800,
  maxWidth: 170,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "right"
}

const cardBottom = {
  display: "flex",
  gap: 10,
  padding: 14,
  borderTop: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.65)"
}

const select = {
  flex: 1,
  padding: 10,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.85)",
  outline: "none",
  fontWeight: 800,
  cursor: "pointer"
}

const miniBtn = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer"
}

const emptyState = {
  padding: 14,
  borderRadius: 18,
  border: "1px dashed rgba(0,0,0,0.15)",
  background: "rgba(255,255,255,0.55)",
  color: "rgba(0,0,0,0.55)"
}

const emptyTitle = { fontWeight: 900, fontSize: 13 }
const emptyText = { marginTop: 6, fontSize: 12 }
