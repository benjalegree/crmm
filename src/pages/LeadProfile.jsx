import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

export default function LeadProfile() {

  const { id } = useParams()
  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])
  const [type, setType] = useState("Call")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

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

  const saveLead = async () => {

    setSaving(true)

    await fetch("/api/updateContact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id,
        fields: {
          Status: lead.fields.Status,
          Notes: lead.fields.Notes
        }
      })
    })

    setSaving(false)
  }

  const addActivity = async () => {

    const res = await fetch("/api/createActivity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        contactId: id,
        type,
        notes: note
      })
    })

    const data = await res.json()

    if (res.ok) {
      setNote("")
      loadActivities()
    } else {
      alert("Error creating activity")
      console.log(data)
    }
  }

  if (!lead) return <div>Loading...</div>

  const f = lead.fields

  return (
    <div>

      <h1>{f["Full Name"]}</h1>

      <div style={card}>

        <label>Status</label>
        <select
          value={f.Status || ""}
          onChange={e => setLead(prev => ({
            ...prev,
            fields: { ...prev.fields, Status: e.target.value }
          }))}
        >
          <option>Not Contacted</option>
          <option>Contacted</option>
          <option>Replied</option>
          <option>Meeting Booked</option>
        </select>

        <label>Permanent Notes</label>
        <textarea
          value={f.Notes || ""}
          onChange={e => setLead(prev => ({
            ...prev,
            fields: { ...prev.fields, Notes: e.target.value }
          }))}
        />

        <button onClick={saveLead}>
          {saving ? "Saving..." : "Save Lead"}
        </button>

      </div>

      <h2 style={{marginTop:"40px"}}>Activity Timeline</h2>

      <div style={activityBox}>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option>Call</option>
          <option>Email</option>
          <option>LinkedIn</option>
          <option>Meeting</option>
        </select>

        <input
          placeholder="What happened?"
          value={note}
          onChange={e => setNote(e.target.value)}
        />

        <button onClick={addActivity}>Add Activity</button>
      </div>

      {activities.map(a => (
        <div key={a.id} style={timelineCard}>
          <strong>{a.fields["Activity Type"]}</strong>
          <div>{a.fields.Notes}</div>
          <small>
            {new Date(a.fields["Activity Date"]).toLocaleString()}
          </small>
        </div>
      ))}

    </div>
  )
}

const card = {
  background: "#fff",
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  gap: "15px"
}

const activityBox = {
  display: "flex",
  gap: "10px",
  marginBottom: "20px"
}

const timelineCard = {
  background: "#fff",
  padding: "15px",
  borderRadius: "16px",
  marginBottom: "10px",
  boxShadow: "0 6px 15px rgba(0,0,0,0.04)"
}
