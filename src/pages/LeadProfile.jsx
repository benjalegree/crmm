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
          Notes: lead.fields.Notes
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
        companyId: lead.fields.Company?.[0],
        type: activityType,
        notes: activityNotes,
        nextFollowUp: nextFollowUp || null
      })
    })

    setActivityNotes("")
    setNextFollowUp("")
    loadActivities()
  }

  if (!lead) return <div>Loading...</div>

  const f = lead.fields

  return (
    <div>
      <h1>{f["Full Name"]}</h1>

      {/* LEAD DETAILS */}
      <div style={card}>

        <label>Email</label>
        <input
          value={f.Email || ""}
          onChange={e => updateField("Email", e.target.value)}
        />

        <label>Position</label>
        <input
          value={f.Position || ""}
          onChange={e => updateField("Position", e.target.value)}
        />

        <label>Status</label>
        <select
          value={f.Status || ""}
          onChange={e => updateField("Status", e.target.value)}
        >
          <option>Not Contacted</option>
          <option>Contacted</option>
          <option>Replied</option>
          <option>Meeting Booked</option>
          <option>Closed Won</option>
          <option>Closed Lost</option>
        </select>

        <label>General Notes</label>
        <textarea
          rows="4"
          value={f.Notes || ""}
          onChange={e => updateField("Notes", e.target.value)}
        />

        <button onClick={saveChanges} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>

      </div>

      {/* CREATE ACTIVITY */}
      <div style={{ ...card, marginTop: "40px" }}>
        <h3>Add Activity</h3>

        <select
          value={activityType}
          onChange={e => setActivityType(e.target.value)}
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
        />

        <label>Next Follow Up Date</label>
        <input
          type="date"
          value={nextFollowUp}
          onChange={e => setNextFollowUp(e.target.value)}
        />

        <button onClick={createActivity}>
          Add Activity
        </button>
      </div>

      {/* ACTIVITY HISTORY */}
      <div style={{ ...card, marginTop: "40px" }}>
        <h3>Activity History</h3>

        {activities.map(activity => (
          <div key={activity.id} style={activityRow}>
            <strong>{activity.fields["Activity Type"]}</strong>
            <p>{activity.fields.Notes}</p>
            <small>{activity.fields["Activity Date"]}</small>
          </div>
        ))}
      </div>

    </div>
  )
}

const card = {
  marginTop: "30px",
  background: "#fff",
  borderRadius: "20px",
  padding: "30px",
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
}

const activityRow = {
  padding: "15px 0",
  borderBottom: "1px solid #eee"
}
