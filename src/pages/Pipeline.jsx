import { useEffect, useState } from "react"

const STATUSES = [
  "Not Contacted",
  "Contacted",
  "Replied",
  "Meeting Booked"
]

export default function Pipeline() {

  const [leads, setLeads] = useState([])
  const [dragging, setDragging] = useState(null)

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    const res = await fetch("/api/getContacts", {
      credentials: "include"
    })
    const data = await res.json()
    setLeads(data.records || [])
  }

  const onDragStart = (lead) => {
    setDragging(lead)
  }

  const onDrop = async (status) => {
    if (!dragging) return

    const updated = leads.map(l =>
      l.id === dragging.id
        ? { ...l, fields: { ...l.fields, Status: status } }
        : l
    )

    setLeads(updated)

    await fetch("/api/updateContact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: dragging.id,
        fields: { Status: status }
      })
    })

    setDragging(null)
  }

  return (
    <div style={container}>
      {STATUSES.map(status => (
        <div
          key={status}
          style={column}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(status)}
        >
          <h3 style={columnTitle}>{status}</h3>

          {leads
            .filter(lead => lead.fields.Status === status)
            .map(lead => (
              <div
                key={lead.id}
                style={card}
                draggable
                onDragStart={() => onDragStart(lead)}
              >
                <div style={name}>{lead.fields["Full Name"]}</div>
                <div style={company}>{lead.fields.Company}</div>
              </div>
            ))
          }

        </div>
      ))}
    </div>
  )
}

const container = {
  display: "flex",
  gap: "20px",
  height: "calc(100vh - 80px)",
  overflowX: "auto"
}

const column = {
  flex: 1,
  minWidth: "250px",
  background: "#f5f5f7",
  borderRadius: "20px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "15px"
}

const columnTitle = {
  fontWeight: "600",
  fontSize: "14px",
  opacity: 0.7
}

const card = {
  background: "white",
  padding: "15px",
  borderRadius: "16px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
  cursor: "grab"
}

const name = {
  fontWeight: "600"
}

const company = {
  fontSize: "12px",
  opacity: 0.6
}
