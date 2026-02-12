import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"

export default function CompanyProfile() {
  const { id } = useParams()
  const [company, setCompany] = useState(null)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/getCompany?id=${id}`, {
        credentials: "include"
      })
      const data = await res.json()
      setCompany(data)
    }

    load()
  }, [id])

  if (!company) return <p>Loading...</p>

  return (
    <div>
      <h1>{company.fields["Company Name"]}</h1>

      <div style={card}>
        <EditableField label="Industry" field="Industry" company={company} />
        <EditableField label="Country" field="Country" company={company} />
        <EditableStatus company={company} />
      </div>
    </div>
  )
}

function EditableField({ label, field, company }) {
  const [value, setValue] = useState(company.fields[field])

  const save = async () => {
    await fetch("/api/updateCompany", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: company.id,
        field,
        value
      })
    })
  }

  return (
    <div style={row}>
      <label>{label}</label>
      <input
        value={value || ""}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        style={input}
      />
    </div>
  )
}

function EditableStatus({ company }) {
  const [status, setStatus] = useState(company.fields.Status)

  const save = async (newStatus) => {
    setStatus(newStatus)

    await fetch("/api/updateCompany", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: company.id,
        field: "Status",
        value: newStatus
      })
    })
  }

  const options = [
    "New",
    "Contacted",
    "Replied",
    "Meeting Booked",
    "Closed Won",
    "Closed Lost"
  ]

  return (
    <div style={row}>
      <label>Status</label>
      <select
        value={status}
        onChange={e => save(e.target.value)}
        style={input}
      >
        {options.map(opt => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

const card = {
  marginTop: "30px",
  background: "#fff",
  padding: "30px",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
}

const row = {
  marginBottom: "20px",
  display: "flex",
  flexDirection: "column"
}

const input = {
  marginTop: "8px",
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid #ddd"
}
