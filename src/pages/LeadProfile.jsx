import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

export default function LeadProfile() {

  const { id } = useParams()

  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [activityType, setActivityType] = useState("Call")

  useEffect(() => {
    loadLead()
    loadActivities()
  }, [id])

  const loadLead = async () => {
    const res = await fetch(`/api/getContact?id=${id}`, {
      credentials: "include"
    })
    const data = await res.json()
    setLead(data)
  }

  const loadActivities = async () => {
    const res = await fetch(`/api/getActivities?contactId=${id}`, {
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

  const saveLead = async () => {

    setLoading(true)

    await fetch("/api/updateContact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id,
        fields: {
          Status: lead.fields.Status,
          Notes: lead.fields.Notes || ""
        }
      })
    })

    setLoading(false)
    loadLead()
  }

  const addActivity = async () => {

    if (!newNote.trim()) return

    await fetch("/api/createActivity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        contactId: id,
        type: activityType,
        notes: newNote
      })
    })

    setNewNote("")
    loadActivities()
  }

  if (!lead) return <div>Loading...</div>

  const f = lead.fields

  return (
    <div style={{ maxWidth: "800px" }}>

      <h1>{f["Full Name"]}</h1>

      <div style={card}>

        <label>Status</label>
        <select
          value={f.Status || ""}
          onChange={e => updateField("Status", e.target.value)}
        >
          <option>Not Contacted</option>
          <option>Contacted</option>
          <option>Replied</option>
          <option>Meeting Booked</option>
        </select>

        <label>Permanent Notes</label>
        <textarea
          value={f.Notes || ""}
          onChange={e => updateField("Notes", e.target.value)}
        />

        <button onClick={saveLead} disabled={loading}>
          {loading ? "Saving..." : "Save Lead"}
        </button>

      </div>

      <h2 style={{ marginTop: "40px" }}>Activity Timeline</h2>

      <div style={{ marginBottom: "20px" }}>
        <select
          value={activityType}
          onChange={e => setActivityType(e.target.value)}
        >
          <option>Call</option>
          <option>Email</option>
          <option>LinkedIn</option>
          <option>Meeting</option>
        </select>

        <input
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Write activity notes..."
          style={{ marginLeft: "10px", width: "300px" }}
        />

        <button onClick={addActivity} style={{ marginLeft: "10px" }}>
          Add Activity
        </button>
      </div>

      <div>
        {activities.map(activity => (
          <div key={activity.id} style={timelineCard}>
            <strong>{activity.fields["Activity Type"]}</strong>
            <div>{activity.fields.Notes}</div>
            <small>{activity.fields["Activity Date"]}</small>
          </div>
        ))}
      </div>

    </div>
  )
}

const card = {
  background: "#fff",
  padding: "20px",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  gap: "10px"
}

const timelineCard = {
  background: "#fff",
  padding: "15px",
  borderRadius: "15px",
  marginBottom: "10px",
  boxShadow: "0 5px 20px rgba(0,0,0,0.05)"
}
