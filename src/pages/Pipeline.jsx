import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Pipeline() {

  const [leads, setLeads] = useState([])
  const navigate = useNavigate()

  const statuses = [
    "Not Contacted",
    "Contacted",
    "Replied",
    "Meeting Booked",
    "Closed Won",
    "Closed Lost"
  ]

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {

    const res = await fetch("/api/crm?action=getContacts", {
      credentials: "include"
    })

    const data = await res.json()

    setLeads(data.records || [])
  }

  const updateStatus = async (leadId, newStatus) => {

    await fetch("/api/crm?action=updateContact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: leadId,
        fields: { Status: newStatus }
      })
    })

    loadLeads()
  }

  return (
    <div>
      <h1>Pipeline</h1>

      <div style={board}>
        {statuses.map(status => (
          <div key={status} style={column}>
            <h3>{status}</h3>

            {leads
              .filter(lead => lead.fields.Status === status)
              .map(lead => (
                <div key={lead.id} style={card}>
                  <div
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <strong>{lead.fields["Full Name"]}</strong>
                    <p>{lead.fields.Position}</p>
                  </div>

                  <select
                    value={lead.fields.Status}
                    onChange={e =>
                      updateStatus(lead.id, e.target.value)
                    }
                  >
                    {statuses.map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const board = {
  display: "flex",
  gap: "20px",
  marginTop: "30px",
  overflowX: "auto"
}

const column = {
  minWidth: "250px",
  background: "#f5f5f7",
  padding: "15px",
  borderRadius: "20px"
}

const card = {
  background: "#fff",
  padding: "15px",
  borderRadius: "15px",
  marginBottom: "15px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  gap: "10px"
}
