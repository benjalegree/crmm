import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Leads() {

  const [leads, setLeads] = useState([])
  const navigate = useNavigate()

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

  return (
    <div>
      <h1>Leads</h1>

      <div style={table}>
        {leads.map(lead => (
          <div
            key={lead.id}
            style={row}
            onClick={() => navigate(`/leads/${lead.id}`)}
          >
            <div>{lead.fields["Full Name"]}</div>
            <div>{lead.fields.Position}</div>
            <div>
              {Array.isArray(lead.fields.Company)
                ? lead.fields.Company[0]
                : lead.fields.Company}
            </div>
            <Status status={lead.fields.Status} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Status({ status }) {

  const colors = {
    "Not Contacted": "#8e8e93",
    "Contacted": "#007aff",
    "Replied": "#5856d6",
    "Meeting Booked": "#34c759",
    "Closed Won": "#30d158",
    "Closed Lost": "#ff3b30"
  }

  return (
    <span style={{
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      background: colors[status] || "#ccc",
      color: "white"
    }}>
      {status}
    </span>
  )
}

const table = {
  marginTop: "30px",
  background: "#fff",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
}

const row = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  padding: "20px",
  borderBottom: "1px solid #f0f0f0",
  cursor: "pointer"
}
