import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"

export default function LeadProfile() {
  const { id } = useParams()

  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])

  const [loadingLead, setLoadingLead] = useState(true)
  const [loadingActs, setLoadingActs] = useState(true)

  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState("")
  const [saveOk, setSaveOk] = useState("")

  const [activityType, setActivityType] = useState("Call")
  const [activityNotes, setActivityNotes] = useState("")
  const [nextFollowUp, setNextFollowUp] = useState("")
  const [creating, setCreating] = useState(false)
  const [actErr, setActErr] = useState("")
  const [actOk, setActOk] = useState("")

  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  // ✅ Normaliza campos reales de Airtable -> campos “estándar” para tu UI
  const normalizeContact = (record) => {
    if (!record || !record.fields) return record
    const f = record.fields

    const notes =
      f.Notes ??
      f["Contact Notes"] ??
      f["Permanent Notes"] ??
      f["Notas"] ??
      f["Observaciones"] ??
      ""

    const phone =
      f.Phone ??
      f["Numero de telefono"] ??
      f["Número de teléfono"] ??
      f["Numero de teléfono"] ??
      f["Teléfono"] ??
      f["Telefono"] ??
      ""

    const linkedin =
      f["LinkedIn URL"] ??
      f.LinkedIn ??
      f.Linkedin ??
      ""

    const nextFU =
      f["Next Follow-up Date"] ??
      f["Next Follow Up Date"] ??
      f["Next follow-up Date"] ??
      f["Próximo seguimiento"] ??
      f["Proximo seguimiento"] ??
      null

    return {
      ...record,
      fields: {
        ...f,
        Notes: notes,
        Phone: phone,
        "LinkedIn URL": linkedin,
        "Next Follow-up Date": nextFU
      }
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line
  }, [id])

  const loadAll = async () => {
    await Promise.all([loadLead(), loadActivities()])
  }

  const loadLead = async () => {
    setLoadingLead(true)
    setSaveErr("")
    setSaveOk("")
    try {
      const res = await fetch(`/api/crm?action=getContact&id=${id}`, {
        credentials: "include"
      })
      const data = await readJson(res)
      if (!res.ok) {
        setLead(null)
        setLoadingLead(false)
        return
      }
      setLead(normalizeContact(data))
    } catch {
      setLead(null)
    }
    setLoadingLead(false)
  }

  const loadActivities = async () => {
    setLoadingActs(true)
    try {
      const res = await fetch(`/api/crm?action=getActivities&contactId=${id}`, {
        credentials: "include"
      })
      const data = await readJson(res)
      if (!res.ok) {
        setActivities([])
        setLoadingActs(false)
        return
      }
      setActivities(data.records || [])
    } catch {
      setActivities([])
    }
    setLoadingActs(false)
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

  const safeErrMsg = (data, fallback) => {
    return (
      data?.error ||
      data?.details?.error?.message ||
      data?.details?.error ||
      data?.details?.message ||
      fallback
    )
  }

  const saveChanges = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!lead) return

    setSaving(true)
    setSaveErr("")
    setSaveOk("")

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

            // ✅ notes generales (UI)
            Notes: lead.fields.Notes || "",

            // ✅ phone (UI)
            Phone: lead.fields.Phone || "",

            // ✅ linkedin (UI)
            "LinkedIn URL": lead.fields["LinkedIn URL"] || "",

            // ✅ next follow-up (contact)
            "Next Follow-up Date": lead.fields["Next Follow-up Date"] || null
          }
        })
      })

      const data = await readJson(res)

      if (!res.ok) {
        setSaveErr(safeErrMsg(data, "Failed to update contact"))
        setSaving(false)
        return
      }

      setSaveOk("Guardado ✅")
      await loadLead() // ✅ vuelve a traer lo guardado real desde Airtable
    } catch {
      setSaveErr("Failed to update contact")
    }

    setSaving(false)
  }

  const createActivity = async (e) => {
    if (e?.preventDefault) e.preventDefault()

    setCreating(true)
    setActErr("")
    setActOk("")

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
        setActErr(safeErrMsg(data, "Failed to create activity"))
        setCreating(false)
        return
      }

      setActivityNotes("")
      setNextFollowUp("")
      setActOk("Actividad guardada ✅")

      // ✅ refresca timeline + refresca lead (por status/next followup auto)
      await Promise.all([loadActivities(), loadLead()])
    } catch {
      setActErr("Failed to create activity")
    }

    setCreating(false)
  }

  if (loadingLead) return <div>Loading...</div>
  if (!lead) return <div>Lead not found</div>

  const f = lead.fields || {}

  const statusPill = useMemo(() => {
    if (!f.Status) return null
    return <span style={pill}>{f.Status}</span>
  }, [f.Status])

  return (
    <div style={page}>
      <div style={headerRow}>
        <h1 style={title}>{f["Full Name"] || "Lead"}</h1>
        <div style={topRight}>
          {statusPill}
          <span style={mutedSmall}>
            {loadingActs ? "Loading activity..." : activities.length ? "" : "No activity yet"}
          </span>
        </div>
      </div>

      <div style={grid}>
        {/* LEFT */}
        <div style={card}>
          <h3 style={h3}>Contact Info</h3>

          <label style={label}>Email</label>
          <input
            style={input}
            value={f.Email || ""}
            onChange={(e) => updateField("Email", e.target.value)}
          />

          <label style={label}>Phone</label>
          <input
            style={input}
            value={f.Phone || ""}
            onChange={(e) => updateField("Phone", e.target.value)}
          />

          <label style={label}>Position</label>
          <input
            style={input}
            value={f.Position || ""}
            onChange={(e) => updateField("Position", e.target.value)}
          />

          <label style={label}>LinkedIn</label>
          <input
            style={input}
            value={f["LinkedIn URL"] || ""}
            onChange={(e) => updateField("LinkedIn URL", e.target.value)}
          />

          <label style={label}>Status</label>
          <select
            style={input}
            value={f.Status || "Not Contacted"}
            onChange={(e) => updateField("Status", e.target.value)}
          >
            <option>Not Contacted</option>
            <option>Contacted</option>
            <option>Replied</option>
            <option>Meeting Booked</option>
            <option>Closed Won</option>
            <option>Closed Lost</option>
          </select>

          <label style={label}>Next Follow-up</label>
          <input
            style={input}
            type="date"
            value={f["Next Follow-up Date"] ? String(f["Next Follow-up Date"]).slice(0, 10) : ""}
            onChange={(e) => updateField("Next Follow-up Date", e.target.value || null)}
          />

          <label style={label}>Notes (general)</label>
          <textarea
            style={textarea}
            rows={5}
            value={f.Notes || ""}
            onChange={(e) => updateField("Notes", e.target.value)}
          />

          {/* ✅ IMPORTANT: type="button" para que NO haga submit/reload */}
          <button type="button" style={btn} onClick={saveChanges} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {saveErr ? <div style={err}>{saveErr}</div> : null}
          {saveOk ? <div style={ok}>{saveOk}</div> : null}
        </div>

        {/* RIGHT */}
        <div style={card}>
          <h3 style={h3}>Add Activity</h3>

          <label style={label}>Type</label>
          <select
            style={input}
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
          >
            <option>Email</option>
            <option>Call</option>
            <option>LinkedIn</option>
            <option>Meeting</option>
          </select>

          <label style={label}>Activity notes</label>
          <textarea
            style={textarea}
            rows={4}
            value={activityNotes}
            onChange={(e) => setActivityNotes(e.target.value)}
          />

          <label style={label}>Next follow-up (optional)</label>
          <input
            style={input}
            type="date"
            value={nextFollowUp}
            onChange={(e) => setNextFollowUp(e.target.value)}
          />

          {/* ✅ IMPORTANT: type="button" para que NO haga submit/reload */}
          <button type="button" style={btn} onClick={createActivity} disabled={creating}>
            {creating ? "Saving..." : "Add Activity"}
          </button>

          {actErr ? <div style={err}>{actErr}</div> : null}
          {actOk ? <div style={ok}>{actOk}</div> : null}

          <div style={timelineHeader}>
            <h3 style={{ margin: 0 }}>Activity Timeline</h3>
            <button type="button" style={miniBtn} onClick={loadActivities}>
              Refresh
            </button>
          </div>

          {loadingActs ? (
            <div style={muted}>Loading activities...</div>
          ) : !activities.length ? (
            <div style={muted}>No activities yet.</div>
          ) : (
            activities.map((a) => (
              <div key={a.id} style={timelineItem}>
                <div style={dot} />
                <div>
                  <strong>{a.fields?.["Activity Type"] || "-"}</strong>
                  <div style={note}>{a.fields?.Notes || ""}</div>
                  <small style={date}>
                    {String(a.fields?.["Activity Date"] || "").replace("T", " ").slice(0, 16)}
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

/* styles */
const page = { width: "100%" }
const headerRow = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }
const topRight = { display: "flex", alignItems: "center", gap: 12 }
const title = { fontSize: 34, fontWeight: 800, margin: 0, color: "#0f3d2e" }
const pill = { fontSize: 12, padding: "6px 10px", borderRadius: 999, background: "rgba(0,0,0,0.06)" }
const mutedSmall = { fontSize: 12, color: "rgba(0,0,0,0.5)" }
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }
const card = {
  padding: 28,
  borderRadius: 26,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 8px 30px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  gap: 10
}
const h3 = { margin: 0, fontSize: 18, fontWeight: 800, color: "#145c43" }
const label = { fontSize: 12, color: "rgba(0,0,0,0.6)", marginTop: 6 }
const input = { padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.8)" }
const textarea = { padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.8)", resize: "vertical" }
const btn = { marginTop: 10, padding: 14, borderRadius: 14, border: "none", background: "#111", color: "#fff", fontWeight: 800, cursor: "pointer" }
const err = { marginTop: 10, padding: 12, borderRadius: 14, background: "rgba(255,0,0,0.08)", color: "#7a1d1d", border: "1px solid rgba(255,0,0,0.12)" }
const ok = { marginTop: 10, padding: 12, borderRadius: 14, background: "rgba(0,200,120,0.10)", color: "#0f5132", border: "1px solid rgba(0,200,120,0.16)" }
const timelineHeader = { marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }
const miniBtn = { padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)", fontWeight: 800, cursor: "pointer", fontSize: 12 }
const muted = { marginTop: 10, fontSize: 13, color: "rgba(0,0,0,0.55)" }
const timelineItem = { display: "flex", gap: 12, padding: 14, borderRadius: 18, background: "rgba(255,255,255,0.65)", border: "1px solid rgba(0,0,0,0.06)", marginTop: 10 }
const dot = { width: 10, height: 10, borderRadius: 999, marginTop: 6, background: "#145c43" }
const note = { marginTop: 6, fontSize: 13, color: "rgba(0,0,0,0.75)" }
const date = { display: "block", marginTop: 6, fontSize: 12, color: "rgba(0,0,0,0.55)" }
