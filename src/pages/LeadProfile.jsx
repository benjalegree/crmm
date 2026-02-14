import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

export default function LeadProfile() {
  const { id } = useParams()

  const [lead, setLead] = useState(null)
  const [leadLoading, setLeadLoading] = useState(true)
  const [leadErr, setLeadErr] = useState("")

  const [activities, setActivities] = useState([])
  const [actLoading, setActLoading] = useState(true)
  const [actErr, setActErr] = useState("")

  const [savingLead, setSavingLead] = useState(false)
  const [saveOk, setSaveOk] = useState("")
  const [saveErr, setSaveErr] = useState("")

  const [activityType, setActivityType] = useState("Call")
  const [activityNotes, setActivityNotes] = useState("")
  const [nextFollowUp, setNextFollowUp] = useState("")
  const [creating, setCreating] = useState(false)
  const [activityOk, setActivityOk] = useState("")
  const [activityCreateErr, setActivityCreateErr] = useState("")

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line
  }, [id])

  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const fmtError = (res, data, fallback) => {
    const parts = []
    parts.push(fallback || "Request failed")
    if (res?.status) parts.push(`(HTTP ${res.status})`)
    const msg =
      data?.error ||
      data?.details?.error?.message ||
      data?.details?.message ||
      ""
    if (msg) parts.push(`- ${msg}`)
    return parts.join(" ")
  }

  const loadAll = async () => {
    await Promise.all([loadLead(), loadActivities()])
  }

  const loadLead = async () => {
    setLeadErr("")
    setLeadLoading(true)
    try {
      const res = await fetch(`/api/crm?action=getContact&id=${id}`, {
        credentials: "include"
      })
      const data = await readJson(res)

      if (!res.ok) {
        setLead(null)
        setLeadErr(fmtError(res, data, "Failed to load lead"))
        setLeadLoading(false)
        return
      }

      setLead(data)
    } catch (e) {
      setLead(null)
      setLeadErr("Network/server error while loading lead")
    }
    setLeadLoading(false)
  }

  const loadActivities = async () => {
    setActErr("")
    setActLoading(true)
    try {
      const res = await fetch(`/api/crm?action=getActivities&contactId=${id}`, {
        credentials: "include"
      })
      const data = await readJson(res)

      if (!res.ok) {
        setActivities([])
        setActErr(fmtError(res, data, "Failed to load activities"))
        setActLoading(false)
        return
      }

      setActivities(data.records || [])
    } catch (e) {
      setActivities([])
      setActErr("Network/server error while loading activities")
    }
    setActLoading(false)
  }

  const updateField = (field, value) => {
    setLead((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: value
      }
    }))
  }

  const saveChanges = async () => {
    if (!lead) return
    setSaveOk("")
    setSaveErr("")
    setSavingLead(true)

    try {
      const res = await fetch("/api/crm?action=updateContact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id,
          fields: {
            Email: lead.fields.Email || "",
            Position: lead.fields.Position || "",
            Status: lead.fields.Status || "",
            Notes: lead.fields.Notes || "",
            "Numero de telefono": lead.fields["Numero de telefono"] || "",
            "LinkedIn URL": lead.fields["LinkedIn URL"] || "",
            "Next Follow-up Date": lead.fields["Next Follow-up Date"] || null
          }
        })
      })

      const data = await readJson(res)

      if (!res.ok) {
        setSaveErr(fmtError(res, data, "Failed to save lead changes"))
        setSavingLead(false)
        return
      }

      setSaveOk("Saved ✅")
      await loadLead()
    } catch (e) {
      setSaveErr("Network/server error while saving lead")
    }

    setSavingLead(false)
  }

  const createActivity = async () => {
    setActivityOk("")
    setActivityCreateErr("")
    setCreating(true)

    try {
      const res = await fetch("/api/crm?action=createActivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contactId: id,
          type: activityType,
          notes: activityNotes,
          nextFollowUp: nextFollowUp || null
        })
      })

      const data = await readJson(res)

      if (!res.ok) {
        setActivityCreateErr(fmtError(res, data, "Failed to create activity"))
        setCreating(false)
        return
      }

      setActivityNotes("")
      setNextFollowUp("")
      setActivityOk("Activity saved ✅")

      await Promise.all([loadActivities(), loadLead()])
    } catch (e) {
      setActivityCreateErr("Network/server error while creating activity")
    }

    setCreating(false)
  }

  if (leadLoading) return <div style={loadingPage}>Loading lead...</div>

  if (leadErr) {
    return (
      <div style={loadingPage}>
        <div style={errBoxBig}>
          <strong>Error</strong>
          <div style={{ marginTop: 8 }}>{leadErr}</div>
          <button style={retryBtn} onClick={loadAll}>Retry</button>
        </div>
      </div>
    )
  }

  if (!lead) return null

  const f = lead.fields || {}

  return (
    <div style={page}>
      <div style={headerRow}>
        <h1 style={title}>{f["Full Name"] || "Lead"}</h1>
        <div style={metaRight}>
          {f.Status ? <span style={pill}>{f.Status}</span> : null}
        </div>
      </div>

      <div style={grid}>
        {/* LEFT */}
        <div style={glassCard}>
          <h3 style={sectionTitle}>Contact Info</h3>

          <label style={label}>Email</label>
          <input
            value={f.Email || ""}
            onChange={(e) => updateField("Email", e.target.value)}
            style={input}
          />

          <label style={label}>Phone</label>
          <input
            value={f["Numero de telefono"] || ""}
            onChange={(e) => updateField("Numero de telefono", e.target.value)}
            style={input}
          />

          <label style={label}>Position</label>
          <input
            value={f.Position || ""}
            onChange={(e) => updateField("Position", e.target.value)}
            style={input}
          />

          <label style={label}>LinkedIn</label>
          <input
            value={f["LinkedIn URL"] || ""}
            onChange={(e) => updateField("LinkedIn URL", e.target.value)}
            style={input}
          />

          <label style={label}>Status</label>
          <select
            value={f.Status || ""}
            onChange={(e) => updateField("Status", e.target.value)}
            style={input}
          >
            <option value="">Select…</option>
            <option>Not Contacted</option>
            <option>Contacted</option>
            <option>Replied</option>
            <option>Meeting Booked</option>
            <option>Closed Won</option>
            <option>Closed Lost</option>
          </select>

          <label style={label}>Next Follow-up</label>
          <input
            type="date"
            value={f["Next Follow-up Date"] ? String(f["Next Follow-up Date"]).slice(0, 10) : ""}
            onChange={(e) => updateField("Next Follow-up Date", e.target.value || null)}
            style={input}
          />

          <label style={label}>Notes (general)</label>
          <textarea
            rows="5"
            value={f.Notes || ""}
            onChange={(e) => updateField("Notes", e.target.value)}
            style={textarea}
          />

          <button style={saveBtn} onClick={saveChanges} disabled={savingLead}>
            {savingLead ? "Saving..." : "Save Changes"}
          </button>

          {saveErr ? <div style={errBox}>{saveErr}</div> : null}
          {saveOk ? <div style={okBox}>{saveOk}</div> : null}
        </div>

        {/* RIGHT */}
        <div style={glassCard}>
          <h3 style={sectionTitle}>Add Activity</h3>

          <label style={label}>Type</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            style={input}
          >
            <option>Call</option>
            <option>Email</option>
            <option>LinkedIn</option>
            <option>Meeting</option>
          </select>

          <label style={label}>Activity notes</label>
          <textarea
            placeholder="What happened?"
            rows="4"
            value={activityNotes}
            onChange={(e) => setActivityNotes(e.target.value)}
            style={textarea}
          />

          <label style={label}>Next follow-up (optional)</label>
          <input
            type="date"
            value={nextFollowUp}
            onChange={(e) => setNextFollowUp(e.target.value)}
            style={input}
          />

          <button
            style={{
              ...saveBtn,
              opacity: creating ? 0.75 : 1,
              cursor: creating ? "not-allowed" : "pointer"
            }}
            onClick={createActivity}
            disabled={creating}
          >
            {creating ? "Saving..." : "Add Activity"}
          </button>

          {activityCreateErr ? <div style={errBox}>{activityCreateErr}</div> : null}
          {activityOk ? <div style={okBox}>{activityOk}</div> : null}

          <div style={timelineHeader}>
            <h3 style={{ margin: 0 }}>Activity Timeline</h3>
            <button style={miniBtn} onClick={loadActivities}>Refresh</button>
          </div>

          {actLoading ? (
            <div style={muted}>Loading activities...</div>
          ) : actErr ? (
            <div style={errBox}>{actErr}</div>
          ) : activities.length === 0 ? (
            <div style={muted}>No activities yet.</div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} style={timelineItem}>
                <div style={timelineDot} />
                <div>
                  <strong style={{ display: "block" }}>
                    {activity.fields?.["Activity Type"] || "-"}
                  </strong>
                  {activity.fields?.Notes ? (
                    <p style={timelineText}>{activity.fields?.Notes}</p>
                  ) : null}
                  <small style={timelineSmall}>
                    {String(activity.fields?.["Activity Date"] || "").replace("T", " ").slice(0, 16)}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ===================== */
/* STYLES */
/* ===================== */

const page = { width: "100%" }

const loadingPage = {
  padding: 40,
  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
}

const headerRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 18
}

const metaRight = { display: "flex", alignItems: "center", gap: 10 }

const pill = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(0,0,0,0.06)"
}

const title = {
  fontSize: 30,
  fontWeight: 700,
  color: "#0f3d2e",
  margin: 0
}

const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }

const glassCard = {
  padding: 30,
  borderRadius: 30,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 8px 30px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  gap: 12
}

const sectionTitle = { margin: "0 0 8px 0", fontWeight: 700, color: "#145c43" }

const label = { fontSize: 12, color: "rgba(0,0,0,0.65)", marginTop: 6 }

const input = {
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.05)",
  background: "rgba(255,255,255,0.75)",
  outline: "none"
}

const textarea = {
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.05)",
  background: "rgba(255,255,255,0.75)",
  outline: "none",
  resize: "vertical"
}

const saveBtn = {
  marginTop: 12,
  padding: 14,
  borderRadius: 16,
  border: "none",
  background: "#111",
  color: "#fff",
  fontWeight: 700
}

const errBox = {
  marginTop: 8,
  padding: 12,
  borderRadius: 16,
  background: "rgba(255,0,0,0.08)",
  border: "1px solid rgba(255,0,0,0.12)",
  color: "#7a1d1d",
  fontSize: 13
}

const okBox = {
  marginTop: 8,
  padding: 12,
  borderRadius: 16,
  background: "rgba(0,200,120,0.10)",
  border: "1px solid rgba(0,200,120,0.16)",
  color: "#0f5132",
  fontSize: 13
}

const errBoxBig = {
  padding: 18,
  borderRadius: 18,
  background: "rgba(255,0,0,0.08)",
  border: "1px solid rgba(255,0,0,0.12)",
  color: "#7a1d1d",
  maxWidth: 520
}

const retryBtn = {
  marginTop: 12,
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "rgba(255,255,255,0.8)",
  cursor: "pointer",
  fontWeight: 700
}

const timelineHeader = {
  marginTop: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between"
}

const muted = { marginTop: 10, fontSize: 13, color: "rgba(0,0,0,0.55)" }

const miniBtn = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.8)",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 12
}

const timelineItem = {
  display: "flex",
  gap: 12,
  padding: 14,
  borderRadius: 18,
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(0,0,0,0.05)",
  marginTop: 10
}

const timelineDot = {
  width: 10,
  height: 10,
  borderRadius: 999,
  marginTop: 6,
  background: "#145c43",
  boxShadow: "0 6px 16px rgba(20,92,67,0.25)"
}

const timelineText = {
  margin: "6px 0 6px 0",
  fontSize: 13,
  color: "rgba(0,0,0,0.72)",
  lineHeight: 1.35
}

const timelineSmall = { fontSize: 12, color: "rgba(0,0,0,0.55)" }
