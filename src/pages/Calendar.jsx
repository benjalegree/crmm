import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Calendar() {

  const [events, setEvents] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadCalendar()
  }, [])

  const loadCalendar = async () => {

    const res = await fetch("/api/crm?action=getCalendar", {
      credentials: "include"
    })

    const data = await res.json()

    const mapped = (data.records || []).map(record => {

      const date = record.fields["Next Follow-up Date"]

      const isOverdue =
        new Date(date) < new Date() &&
        record.fields.Status !== "Completed"

      return {
        id: record.id,
        title: record.fields["Activity Type"],
        date,
        contactId: record.fields["Related Contact"]?.[0],
        overdue: isOverdue
      }
    })

    setEvents(mapped)
  }

  return (
    <div>
      <h1>Calendar</h1>

      <div style={grid}>
        {events.map(event => (
          <div
            key={event.id}
            style={{
              ...card,
              borderLeft: event.overdue
                ? "6px solid #ff3b30"
                : "6px solid #007aff"
            }}
            onClick={() => navigate(`/leads/${event.contactId}`)}
          >
            <strong>{event.title}</strong>
            <p>{event.date}</p>
            {event.overdue && <span style={overdue}>Overdue</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

const grid = {
  marginTop: "30px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "20px"
}

const card = {
  background: "#fff",
  padding: "20px",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  cursor: "pointer"
}

const overdue = {
  color: "#ff3b30",
  fontWeight: "bold"
}
