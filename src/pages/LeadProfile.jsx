import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

export default function LeadProfile() {

  const { id } = useParams()

  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)

  const [activityType, setActivityType] = useState("Call")
  const [activityNotes, setActivityNotes] = useState("")
  const [nextFollowUp, setNextFollowUp] = useState("")

  useEffect(() => {
    loadLead()
    loadActivities()
  }, [id])

  const loadLead = async () => {
    const res = await fetch(`/api/crm?action=getContact&id=${id}`, {
      credentials: "include"
    })

    const data = await res.json()
    setLead(data)
  }

  const loadActivities = async () => {
    const res = await fetch(`/api/crm?action=getActivities&contactId=${id}`, {
      credentials: "include"
    })

    const data = await res.json()
    setActivities(data.records || [])
  }

  const updateField = (field, value) => {
    setLead(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: value
      }
    }))
  }

  const saveChanges = async () => {
    setLoading(true)

    await fetch("/api/crm?action=updateContact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id,
        fields: {
          Email: lead.fields.Email,
          Position: lead.fields.Position,
          Status: lead.fields.Status,
          Notes: lead.fields.Notes
        }
      })
    })

    setLoading(false)
  }

  const createActivity = async () => {
    if (!activityType) return

    await fetch("/api/crm?action=createActivity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        contactId: id,
        companyId: lead.fields.Company?.[0],
        type: activityType,
        notes: activityNotes,
        nextFollowUp: nextFollowUp || null
      })
    })

    setActivityNotes("")
    setNextFollowUp("")
    loadActivities()
  }

  if (!lead) return <div>Loading...</div>

  const f = lead.fields

  return (
    <div>

      <h1 style={title}>{f["Full Name"]}</h1>
      <p style={subtitle}>Lead details & activity timeline</p>

      <div style={layout}>

        {/* LEFT COLUMN */}
        <div style={column}>

          <GlassCard>

            <Input label="Email">
              <input
                value={f.Email || ""}
                onChange={e => updateField("Email", e.target.value)}
                style={input}
              />
            </Input>

            <Input label="Position">
              <input
                value={f.Position || ""}
                onChange={e => updateField("Position", e.target.value)}
                style={input}
              />
            </Input>

            <Input label="Status">
              <select
                value={f.Status || ""}
                onChange={e => updateField("Status", e.target.value)}
                style={input}
              >
                <option>Not Contacted</option>
                <option>Contacted</option>
                <option>Replied</option>
                <option>Meeting Booked</option>
                <option>Closed Won</option>
                <option>Closed Lost</option>
              </select>
            </Input>

            <Input label="Notes">
              <textarea
                rows="4"
                value={f.Notes || ""}
                onChange={e => updateField("Notes", e.target.value)}
                style={textarea}
              />
            </Input>

            <button
              onClick={saveChanges}
              disabled={loading}
              style={primaryButton}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>

          </GlassCard>

          <GlassCard>

            <h3 style={sectionTitle}>Add Activity</h3>

            <select
              value={activityType}
              onChange={e => setActivityType(e.target.value)}
              style={input}
            >
              <option>Call</option>
              <option>Email</option>
              <option>LinkedIn</option>
              <option>Meeting</option>
            </select>

            <textarea
              placeholder="Activity notes..."
              rows="3"
              value={activityNotes}
              onChange={e => setActivityNotes(e.target.value)}
              style={textarea}
            />

            <input
              type="date"
              value={nextFollowUp}
              onChange={e => setNextFollowUp(e.target.value)}
              style={input}
            />

            <button onClick={createActivity} style={secondaryButton}>
              Add Activity
            </button>

          </GlassCard>

        </div>

        {/* RIGHT COLUMN */}
        <div style={column}>

          <GlassCard>

            <h3 style={sectionTitle}>Activity Timeline</h3>

            {activities.map(activity => (
              <div key={activity.id} style={activityRow}>
                <div style={activityTypeStyle}>
                  {activity.fields["Activity Type"]}
                </div>
                <div style={activityNotesStyle}>
                  {activity.fields.Notes}
                </div>
                <div style={activityDate}>
                  {new Date(activity.fields["Activity Date"]).toLocaleDateString()}
                </div>
              </div>
            ))}

          </GlassCard>

        </div>

      </div>
    </div>
  )
}

/* ================== COMPONENTS ================== */

function GlassCard({ children }) {
  return (
    <div style={glassCard}>
      {children}
    </div>
  )
}

function Input({ label, children }) {
  return (
    <div style={{ marginBottom: "25px" }}>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  )
}

/* ================== STYLES ================== */

const title = {
  fontSize: "34px",
  fontWeight: "600"
}

const subtitle = {
  fontSize: "15px",
  color: "#6e6e73",
  marginTop: "8px",
  marginBottom: "40px"
}

const layout = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "40px"
}

const column = {
  display: "flex",
  flexDirection: "column",
  gap: "40px"
}

const glassCard = {
  backdropFilter: "blur(40px)",
  background: "rgba(255,255,255,0.45)",
  borderRadius: "30px",
  padding: "40px",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 25px 60px rgba(0,0,0,0.08)"
}

const labelStyle = {
  fontSize: "13px",
  color: "#6e6e73",
  marginBottom: "10px",
  fontWeight: "500"
}

const input = {
  width: "100%",
  padding: "16px 20px",
  borderRadius: "20px",
  border: "1px solid rgba(0,0,0,0.05)",
  background: "rgba(255,255,255,0.6)",
  fontSize: "14px",
  outline: "none"
}

const textarea = {
  ...input,
  resize: "none"
}

const primaryButton = {
  marginTop: "10px",
  padding: "16px",
  borderRadius: "20px",
  border: "none",
  background: "linear-gradient(135deg, #007aff, #5ac8fa)",
  color: "white",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 15px 40px rgba(0,122,255,0.3)"
}

const secondaryButton = {
  marginTop: "15px",
  padding: "14px",
  borderRadius: "20px",
  border: "none",
  background: "#1c1c1e",
  color: "white",
  fontWeight: "500",
  cursor: "pointer"
}

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  marginBottom: "25px"
}

const activityRow = {
  padding: "18px 0",
  borderBottom: "1px solid rgba(0,0,0,0.05)"
}

const activityTypeStyle = {
  fontWeight: "600",
  fontSize: "14px"
}

const activityNotesStyle = {
  fontSize: "14px",
  color: "#6e6e73",
  marginTop: "6px"
}

const activityDate = {
  fontSize: "12px",
  color: "#8e8e93",
  marginTop: "6px"
}
