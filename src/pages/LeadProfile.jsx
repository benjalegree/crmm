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

  useEffect(() => {
    loadLead()
    loadActivities()
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

    setLoading(false)
  }

  const createActivity = async () => {

    if (!activityType) return

    await fetch("/api/crm?action=createActivity", {
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

    setActivityNotes("")
    setNextFollowUp("")
    loadActivities()
  }

  if (!lead) return null

  const f = lead.fields

  return (
    <div style={{ width: "100%" }}>

      <h1 style={{ fontSize: 28, marginBottom: 30 }}>{f["Full Name"]}</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>

        <div style={glassCard}>
          <h3>Contact Info</h3>

          <input style={input} value={f.Email || ""} onChange={e => updateField("Email", e.target.value)} />
          <input style={input} value={f["Numero de telefono"] || ""} onChange={e => updateField("Numero de telefono", e.target.value)} />
          <input style={input} value={f.Position || ""} onChange={e => updateField("Position", e.target.value)} />
          <input style={input} value={f["LinkedIn URL"] || ""} onChange={e => updateField("LinkedIn URL", e.target.value)} />

          <select style={input} value={f.Status || ""} onChange={e => updateField("Status", e.target.value)}>
            <option>Not Contacted</option>
            <option>Contacted</option>
            <option>Replied</option>
            <option>Meeting Booked</option>
            <option>Closed Won</option>
            <option>Closed Lost</option>
          </select>

          <textarea
            rows="4"
            style={input}
            value={f.Notes || ""}
            onChange={e => updateField("Notes", e.target.value)}
          />

          <button style={btn} onClick={saveChanges}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div style={glassCard}>
          <h3>Add Activity</h3>

          <select style={input} value={activityType} onChange={e => setActivityType(e.target.value)}>
            <option>Call</option>
            <option>Email</option>
            <option>LinkedIn</option>
            <option>Meeting</option>
          </select>

          <textarea
            rows="3"
            style={input}
            value={activityNotes}
            onChange={e => setActivityNotes(e.target.value)}
            placeholder="Activity notes..."
          />

          <input
            type="date"
            style={input}
            value={nextFollowUp}
            onChange={e => setNextFollowUp(e.target.value)}
          />

          <button style={btn} onClick={createActivity}>
            Add Activity
          </button>

          <h3 style={{ marginTop: 40 }}>Activity Timeline</h3>

          {activities.map(activity => (
            <div key={activity.id} style={timelineItem}>
              <strong>{activity.fields["Activity Type"]}</strong>
              <p>{activity.fields.Notes}</p>
              <small>{activity.fields["Activity Date"]}</small>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

const glassCard = {
  padding: 30,
  borderRadius: 30,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.4)",
  display: "flex",
  flexDirection: "column",
  gap: 15
}

const input = {
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.05)",
  background: "rgba(255,255,255,0.8)"
}

const btn = {
  padding: "12px 20px",
  borderRadius: 20,
  border: "none",
  background: "#145c43",
  color: "#fff",
  cursor: "pointer"
}

const timelineItem = {
  marginTop: 15,
  padding: 15,
  borderRadius: 20,
  background: "rgba(255,255,255,0.6)"
}
