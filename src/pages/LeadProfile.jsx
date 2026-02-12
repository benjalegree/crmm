import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

export default function LeadProfile() {
  const { id } = useParams()
  const [lead, setLead] = useState(null)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/getContact?id=${id}`, {
        credentials: "include"
      })
      const data = await res.json()
      setLead(data)
    }

    load()
  }, [id])

  if (!lead) return <div>Loading...</div>

  const f = lead.fields

  return (
    <div>
      <h1>{f["Full Name"]}</h1>

      <div style={card}>
        <p><strong>Email:</strong> {f.Email}</p>
        <p><strong>Position:</strong> {f.Position}</p>
        <p><strong>Company:</strong> {f.Company?.[0]}</p>
        <p><strong>Status:</strong> {f.Status}</p>
        <p><strong>LinkedIn:</strong> <a href={f["LinkedIn URL"]} target="_blank">{f["LinkedIn URL"]}</a></p>
      </div>
    </div>
  )
}

const card = {
  background: "#fff",
  padding: "30px",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  marginTop: "20px"
}
