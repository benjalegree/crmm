import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

export default function LeadProfile() {

  const { id } = useParams()
  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])
  const [newActivity, setNewActivity] = useState("")
  const [type, setType] = useState("Call")

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

  const addActivity = async () => {

    await fetch("/api/createActivity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        contactId: id,
        companyId: lead.fields.Company?.[0],
        type,
        notes: newActivity
      })
    })

    setNewActivity("")
    loadActivities()
  }

  if (!lead) return <div>Loading...</div>

  const f = lead.fields

  return (
    <div>
      <h1>{f["Full Name"]}</h1>

      <div style={card}>
        <p><strong>Email:</strong> {f.Email}</p>
        <p><strong>Position:</strong> {f.Position}</p>
        <p><strong>Company:</strong> {f.Company}</p>
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
          placeholder="Add notes..."
          value={newActivity}
          onChange={e => setNewActivity(e.target.value)}
        />

        <button onClick={addActivity}>Add</button>
      </div>

      {activities.map(a => (
        <div key={a.id} style={timelineCard}>
          <strong>{a.fields["Activity Type"]}</strong>
          <div>{a.fields.Notes}</div>
          <small>{new Date(a.fields["Activity Date"]).toLocaleString()}</small>
        </div>
      ))}

    </div>
  )
}

const card = {
  background: "#fff",
  padding: "20px",
  borderRadius: "16px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)"
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
