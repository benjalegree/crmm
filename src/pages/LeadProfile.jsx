import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

export default function LeadProfile() {
  const { id } = useParams()

  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)

  const [activityType, setActivityType] = useState("Call")
  const [activityNotes, setActivityNotes] = useState("")
  const [nextFollowUp, setNextFollowUp] = useState("")
  const [creating, setCreating] = useState(false)
  const [activityErr, setActivityErr] = useState("")
  const [activityOk, setActivityOk] = useState("")

  useEffect(() => {
    loadLead()
    loadActivities()
    // eslint-disable-next-line
  }, [id])

  const loadLead = async () => {
    const res = await fetch(`/api/crm?action=getContact&id=${id}`, {
      credentials: "include"
    })
    const data = await res.json()
    setLead(data)
  }

  const loadActivities = async () => {
    const res = await fetch(`/api/crm?action=getActivities&contactId=${id}`, {
      credentials: "include"
    })
    const data = await res.json()
    setActivities(data.records || [])
  }

  const updateField = (field, value) => {
    setLead(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: value
      }
    }))
  }

  const saveChanges = async () => {
    setLoading(true)

    try {
      await fetch("/api/crm?action=updateContact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id,
          fields: {
            Email: lead.fields.Email,
            Position: lead.fields.Position,
            Status: lead.fields.Status,
            Notes: lead.fields.Notes,
            "Numero de telefono": lead.fields["Numero de telefono"],
            "LinkedIn URL": lead.fields["LinkedIn URL"]
          }
        })
      })
    } finally {
      setLoading(false)
    }
  }

  const createActivity = async () => {
    setActivityErr("")
    setActivityOk("")
    setCreating(true)

    try {
      const res = await fetch("/api/crm?action=createActivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contactId: id,
          type: activityType,
          notes: activityNotes,
          nextFollowUp: nextFollowUp || null
        })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg =
          data?.error ||
          data?.details?.error?.message ||
          data?.details?.message ||
          "Failed to create activity"

        setActivityErr(msg)
        console.error("CREATE ACTIVITY ERROR:", data)
        setCreating(false)
        return
      }

      setActivityNotes("")
      setNextFollowUp("")
      setActivityOk("Activity saved ✅")

      await loadActivities()
    } catch (e) {
      console.error("CREATE ACTIVITY CRASH:", e)
      setActivityErr("Network/server error while creating activity")
    } finally {
      setCreating(false)
    }
  }

  if (!lead) return null

  const f = lead.fields || {}

  return (
    <div style={page}>
      <h1 style={title}>{f["Full Name"] || "Lead"}</h1>

      <div style={grid}>
        {/* LEFT COLUMN */}
        <div style={glassCard}>
          <h3 style={sectionTitle}>Contact Info</h3>

          <label>Email</label>
          <input
            value={f.Email || ""}
            onChange={e => updateField("Email", e.target.value)}
            style={input}
          />

          <label>Phone</label>
          <input
            value={f["Numero de telefono"] || ""}
            onChange={e => updateField("Numero de telefono", e.target.value)}
            style={input}
          />

          <label>Position</label>
          <input
            value={f.Position || ""}
            onChange={e => updateField("Position", e.target.value)}
            style={input}
          />

          <label>LinkedIn</label>
          <input
            value={f["LinkedIn URL"] || ""}
            onChange={e => updateField("LinkedIn URL", e.target.value)}
            style={input}
          />

          <label>Status</label>
          <select
            value={f.Status || ""}
            onChange={e => updateField("Status", e.target.value)}
            style={input}
          >
            <option>Not Contacted</option>
            <option>Contacted</option>
            <option>Replied</option>
            <option>Meeting Booked</option>
            <option>Closed Won</option>
            <option>Closed Lost</option>
          </select>

          <label>Notes</label>
          <textarea
            rows="4"
            value={f.Notes || ""}
            onChange={e => updateField("Notes", e.target.value)}
            style={input}
          />

          <button style={saveBtn} onClick={saveChanges} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* RIGHT COLUMN */}
        <div style={glassCard}>
          <h3 style={sectionTitle}>Add Activity</h3>

          <select
            value={activityType}
            onChange={e => setActivityType(e.target.value)}
            style={input}
          >
            <option>Call</option>
            <option>Email</option>
            <option>LinkedIn</option>
            <option>Meeting</option>
          </select>

          <textarea
            placeholder="Activity notes..."
            rows="3"
            value={activityNotes}
            onChange={e => setActivityNotes(e.target.value)}
            style={input}
          />

          <input
            type="date"
            value={nextFollowUp}
            onChange={e => setNextFollowUp(e.target.value)}
            style={input}
          />

          <button
            style={{
              ...saveBtn,
              opacity: creating ? 0.75 : 1,
              cursor: creating ? "not-allowed" : "pointer"
            }}
            onClick={createActivity}
            disabled={creating}
          >
            {creating ? "Saving..." : "Add Activity"}
          </button>

          {activityErr && <div style={errBox}>{activityErr}</div>}
          {activityOk && <div style={okBox}>{activityOk}</div>}

          <h3 style={{ marginTop: 40 }}>Activity Timeline</h3>

          {activities.map(activity => (
            <div key={activity.id} style={timelineItem}>
              <div style={timelineDot} />
              <div>
                <strong>{activity.fields?.["Activity Type"] || "-"}</strong>
                <p>{activity.fields?.Notes || ""}</p>
                <small>{activity.fields?.["Activity Date"] || ""}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ===================== */
/* STYLES */
/* ===================== */

const page = { width: "100%" }

const title = {
  fontSize: 30,
  fontWeight: 700,
  color: "#0f3d2e",
  marginBottom: 30
}

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 30
}

const glassCard = {
  padding: 30,
  borderRadius: 30,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 8px 30px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  gap: 15
}

const sectionTitle = {
  marginBottom: 10,
  fontWeight: 600,
  color: "#145c43"
}

const input = {
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.05)",
  background: "rgba(255,255,255,0.7)",
  outline: "none"
}

const saveBtn = {
  marginTop: 15,
  padding: "12px 20px",
  borderRadius: 20,
  border: "none",
  background: "#145c43",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer"
}

const timelineItem = {
  display: "flex",
  gap: 15,
  marginTop: 15,
  padding: 15,
  borderRadius: 20,
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(20px)"
}

const timelineDot = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  background: "#145c43",
  marginTop: 6
}

const errBox = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 14,
  background: "rgba(255, 59, 48, 0.12)",
  border: "1px solid rgba(255, 59, 48, 0.25)",
  color: "#b42318",
  fontWeight: 700
}

const okBox = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 14,
  background: "rgba(52, 199, 89, 0.12)",
  border: "1px solid rgba(52, 199, 89, 0.25)",
  color: "#0f5132",
  fontWeight: 700
}
