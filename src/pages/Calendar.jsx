import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Calendar() {

  const [events, setEvents] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadCalendar()
  }, [])

  const loadCalendar = async () => {
    const res = await fetch("/api/getCalendar", {
      credentials: "include"
    })
    const data = await res.json()
    setEvents(data.events || [])
  }

  const groupByDate = events.reduce((acc, event) => {
    acc[event.date] = acc[event.date] || []
    acc[event.date].push(event)
    return acc
  }, {})

  return (
    <div>
      <h1>Calendar</h1>

      {Object.keys(groupByDate)
        .sort()
        .map(date => (
          <div key={date} style={dayBlock}>
            <h3>{date}</h3>

            {groupByDate[date].map(event => (
              <div
                key={event.id}
                style={{
                  ...eventCard,
                  background: event.overdue ? "#ffe5e5" : "#f5f5f7"
                }}
                onClick={() => navigate(`/leads/${event.contactId}`)}
              >
                {event.title}
              </div>
            ))}
          </div>
        ))
      }

    </div>
  )
}

const dayBlock = {
  marginBottom: "30px",
  padding: "20px",
  background: "#fff",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
}

const eventCard = {
  padding: "12px",
  marginTop: "10px",
  borderRadius: "12px",
  cursor: "pointer"
}
