import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Calendar() {
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All") // All | Overdue | Upcoming

  useEffect(() => {
    loadCalendar()
    // eslint-disable-next-line
  }, [])

  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const loadCalendar = async () => {
    setLoading(true)
    setErr("")
    try {
      const res = await fetch("/api/crm?action=getCalendar", {
        credentials: "include"
      })
      const data = await readJson(res)
      if (!res.ok) {
        setErr(data?.error || "Failed to load calendar")
        setEvents([])
        setLoading(false)
        return
      }

      const mapped = (data.records || []).map((record) => {
        const date = record.fields?.["Next Follow-up Date"] || ""
        const status = record.fields?.Status || ""
        const title = record.fields?.["Activity Type"] || "Activity"
        const contactId = record.fields?.["Related Contact"]?.[0]

        const d = date ? new Date(date) : null
        const now = new Date()

        const isOverdue = !!d && d < now && status !== "Completed"

        return {
          id: record.id,
          title,
          date,
          dateObj: d,
          contactId,
          status,
          overdue: isOverdue
        }
      })

      // sort: overdue first, then soonest
      mapped.sort((a, b) => {
        if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
        const at = a.dateObj ? a.dateObj.getTime() : Number.POSITIVE_INFINITY
        const bt = b.dateObj ? b.dateObj.getTime() : Number.POSITIVE_INFINITY
        return at - bt
      })

      setEvents(mapped)
      setLoading(false)
    } catch {
      setErr("Failed to load calendar")
      setEvents([])
      setLoading(false)
    }
  }

  const normalizeStr = (v) => String(v || "").toLowerCase()

  const filtered = useMemo(() => {
    const q = normalizeStr(search.trim())
    let list = events || []

    if (filter === "Overdue") list = list.filter((e) => e.overdue)
    if (filter === "Upcoming") list = list.filter((e) => !e.overdue)

    if (!q) return list
    return list.filter((e) => {
      return (
        normalizeStr(e.title).includes(q) ||
        normalizeStr(e.status).includes(q) ||
        normalizeStr(e.date).includes(q)
      )
    })
  }, [events, search, filter])

  const counts = useMemo(() => {
    const total = events.length
    const overdue = events.filter((e) => e.overdue).length
    const upcoming = total - overdue
    return { total, overdue, upcoming }
  }, [events])

  return (
    <div style={page}>
      <div style={head}>
        <div>
          <h1 style={title}>Calendar</h1>
          <p style={subtitle}>Follow-ups and activities in a clean workspace</p>
        </div>

        <button style={ghostBtn} onClick={loadCalendar} type="button">
          Refresh
        </button>
      </div>

      <div style={controls}>
        <input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInput}
        />

        <div style={selectRow}>
          <div style={selectWrap}>
            <span style={selectLabel}>View</span>
            <select style={select} value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="All">All ({counts.total})</option>
              <option value="Overdue">Overdue ({counts.overdue})</option>
              <option value="Upcoming">Upcoming ({counts.upcoming})</option>
            </select>
          </div>

          <button style={miniBtn} onClick={() => setSearch("")} type="button">
            Clear
          </button>
        </div>
      </div>

      {err ? (
        <div style={errBox}>
          {err}
          <button style={{ ...miniBtn, marginTop: 10 }} onClick={loadCalendar} type="button">
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <div style={loadingBox}>Loading...</div>
      ) : (
        <div style={list}>
          <div style={listHeader}>
            <div style={hCell}>Activity</div>
            <div style={hCell}>Date</div>
            <div style={hCell}>Status</div>
            <div style={{ ...hCell, textAlign: "right" }}>Flag</div>
          </div>

          {filtered.length ? (
            filtered.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onOpen={() => event.contactId && navigate(`/leads/${event.contactId}`)}
              />
            ))
          ) : (
            <div style={emptyRow}>
              <div style={emptyTitle}>No events found</div>
              <div style={emptySub}>Try changing filters or search terms.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ========================= */
/* ROW */
/* ========================= */

function EventRow({ event, onOpen }) {
  const dateLabel = formatDate(event.date)

  return (
    <div style={row} onClick={onOpen}>
      <div style={colName}>
        <div style={bigName}>{event.title || "—"}</div>
        <div style={miniLine}>
          <span style={muted}>Follow-up</span>
          <span style={dot}>•</span>
          <span style={muted}>{event.contactId ? `Lead: ${event.contactId}` : "No lead linked"}</span>
        </div>
      </div>

      <div style={colText}>{dateLabel}</div>

      <div style={colText}>{event.status || "—"}</div>

      <div style={colStatus}>
        {event.overdue ? (
          <span style={{ ...statusPill, ...pillOverdue }}>Overdue</span>
        ) : (
          <span style={{ ...statusPill, ...pillOk }}>Upcoming</span>
        )}
      </div>
    </div>
  )
}

/* ========================= */
/* HELPERS */
/* ========================= */

function formatDate(dateStr) {
  const s = String(dateStr || "").trim()
  if (!s) return "—"
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s

  const now = new Date()
  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()

  const pad = (n) => String(n).padStart(2, "0")
  const dd = pad(d.getDate())
  const mm = pad(d.getMonth() + 1)
  const yy = String(d.getFullYear()).slice(-2)
  const hh = pad(d.getHours())
  const min = pad(d.getMinutes())

  return `${dd}/${mm}/${yy} ${hh}:${min}${isSameDay ? " (today)" : ""}`
}

/* ========================= */
/* STYLES (MISMA ESTÉTICA QUE LEADS/COMPANIES) */
/* ========================= */

const page = { width: "100%" }

const head = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 14
}

const title = {
  fontSize: 40,
  fontWeight: 900,
  color: "#0f3d2e",
  margin: 0
}

const subtitle = {
  marginTop: 8,
  marginBottom: 0,
  color: "rgba(0,0,0,0.55)",
  fontWeight: 600
}

const controls = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 16,
  marginBottom: 18,
  flexWrap: "wrap"
}

const searchInput = {
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(18px)",
  outline: "none",
  minWidth: 320,
  flex: "1 1 320px"
}

const selectRow = { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }

const selectWrap = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(18px)"
}

const selectLabel = { fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.55)" }

const select = {
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.85)",
  borderRadius: 14,
  padding: "10px 12px",
  outline: "none",
  fontWeight: 800
}

const ghostBtn = {
  padding: "12px 14px",
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(18px)",
  cursor: "pointer",
  fontWeight: 900
}

const miniBtn = {
  padding: "12px 14px",
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(18px)",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12
}

const errBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)"
}

const loadingBox = { padding: 20, color: "rgba(0,0,0,0.55)" }

const list = {
  borderRadius: 28,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.45)",
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)"
}

const listHeader = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 0.8fr",
  gap: 12,
  padding: "16px 18px",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  color: "rgba(0,0,0,0.55)"
}

const hCell = {
  fontWeight: 900,
  color: "rgba(0,0,0,0.55)",
  fontSize: 12
}

const row = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 0.8fr",
  gap: 12,
  padding: "18px 18px",
  borderTop: "1px solid rgba(0,0,0,0.05)",
  cursor: "pointer"
}

const colName = { display: "flex", flexDirection: "column", gap: 6 }
const bigName = { fontWeight: 900, color: "#0f3d2e", fontSize: 16 }

const miniLine = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }
const muted = { color: "rgba(0,0,0,0.55)", fontWeight: 700, fontSize: 12 }
const dot = { color: "rgba(0,0,0,0.20)", fontWeight: 900 }

const colText = { color: "rgba(0,0,0,0.65)", fontWeight: 700, display: "flex", alignItems: "center" }

const colStatus = { display: "flex", alignItems: "center", justifyContent: "flex-end" }

const statusPill = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.10)",
  fontWeight: 900,
  fontSize: 12,
  whiteSpace: "nowrap"
}

const pillOk = {
  background: "rgba(20,92,67,0.10)",
  borderColor: "rgba(20,92,67,0.18)",
  color: "#145c43"
}

const pillOverdue = {
  background: "rgba(255,0,0,0.08)",
  borderColor: "rgba(255,0,0,0.12)",
  color: "#7a1d1d"
}

const emptyRow = {
  padding: 22
}

const emptyTitle = {
  fontWeight: 950,
  color: "#0f3d2e"
}

const emptySub = {
  marginTop: 6,
  color: "rgba(0,0,0,0.55)",
  fontWeight: 700,
  fontSize: 13
}
