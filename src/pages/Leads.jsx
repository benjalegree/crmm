import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Leads() {

  const [leads, setLeads] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetch("/api/crm?action=getContacts", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => setLeads(data.records || []))
  }, [])

  return (
    <div>
      <h1 style={title}>Leads</h1>

      <div style={glassCard}>
        {leads.map(lead => (
          <div
            key={lead.id}
            style={row}
            onClick={() => navigate(`/leads/${lead.id}`)}
          >
            <div style={name}>{lead.fields["Full Name"]}</div>

            <div style={subText}>{lead.fields.Position}</div>

            <div style={subText}>
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

/* ========================= */
/* STATUS COMPONENT */
/* ========================= */

function Status({ status }) {

  const colors = {
    "Not Contacted": "#8e8e93",
    "Contacted": "#1e7a57",
    "Replied": "#0f3d2e",
    "Meeting Booked": "#34c759",
    "Closed Won": "#30d158",
    "Closed Lost": "#ff3b30"
  }

  return (
    <span style={{
      padding: "6px 14px",
      borderRadius: "18px",
      fontSize: "12px",
      fontWeight: "600",
      background: colors[status] || "#ccc",
      color: "#ffffff"
    }}>
      {status}
    </span>
  )
}

/* ========================= */
/* STYLES */
/* ========================= */

const title = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#0f3d2e",
  marginBottom: "40px"
}

const glassCard = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  WebkitBackdropFilter: "blur(30px)",
  borderRadius: "26px",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 20px 50px rgba(15,61,46,0.12)",
  padding: "10px 0"
}

const row = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  padding: "22px 30px",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  cursor: "pointer",
  transition: "background 0.2s ease"
}

const name = {
  fontWeight: "600",
  color: "#0f3d2e"
}

const subText = {
  color: "#1e7a57",
  fontSize: "14px"
}
