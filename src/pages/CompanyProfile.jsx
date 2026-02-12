import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

export default function CompanyProfile() {

  const { id } = useParams()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCompany()
  }, [id])

  const loadCompany = async () => {
    const res = await fetch(`/api/crm?action=getCompany&id=${id}`, {
      credentials: "include"
    })

    const data = await res.json()
    setCompany(data)
  }

  const updateField = (field, value) => {
    setCompany(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: value
      }
    }))
  }

  const saveChanges = async () => {

    setLoading(true)

    await fetch("/api/crm?action=updateCompany", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id,
        fields: {
          "Company Name": company.fields["Company Name"],
          Industry: company.fields.Industry,
          Country: company.fields.Country,
          Status: company.fields.Status,
          "Responsible Email": company.fields["Responsible Email"]
        }
      })
    })

    setLoading(false)
  }

  if (!company) return <div>Loading...</div>

  const f = company.fields

  return (
    <div>
      <h1>{f["Company Name"]}</h1>

      <div style={card}>

        <label>Industry</label>
        <input
          value={f.Industry || ""}
          onChange={e => updateField("Industry", e.target.value)}
        />

        <label>Country</label>
        <input
          value={f.Country || ""}
          onChange={e => updateField("Country", e.target.value)}
        />

        <label>Status</label>
        <select
          value={f.Status || ""}
          onChange={e => updateField("Status", e.target.value)}
        >
          <option>New</option>
          <option>Contacted</option>
          <option>Replied</option>
          <option>Meeting Booked</option>
          <option>Closed Won</option>
          <option>Closed Lost</option>
        </select>

        <label>Responsible Email</label>
        <input
          value={f["Responsible Email"] || ""}
          onChange={e => updateField("Responsible Email", e.target.value)}
        />

        <button onClick={saveChanges} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>

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
