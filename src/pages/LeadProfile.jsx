import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

export default function LeadProfile() {

  const { id } = useParams()
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLead()
  }, [id])

  const loadLead = async () => {
    const res = await fetch(`/api/getContact?id=${id}`, {
      credentials: "include"
    })
    const data = await res.json()
    setLead(data)
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

    await fetch("/api/updateContact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id,
        fields: {
          Email: lead.fields.Email,
          Position: lead.fields.Position,
          Status: lead.fields.Status
        }
      })
    })

    setLoading(false)
  }

  if (!lead) return <div>Loading...</div>

  const f = lead.fields

  return (
    <div>
      <h1>{f["Full Name"]}</h1>

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
        </select>

        <button onClick={saveChanges} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>

      </div>
    </div>
  )
}

const card = {
