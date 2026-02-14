import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"

export default function LeadProfile() {
  const { id } = useParams()

  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])

  const [loadingLead, setLoadingLead] = useState(true)
  const [loadingActs, setLoadingActs] = useState(true)

  const [errLead, setErrLead] = useState("")
  const [errActs, setErrActs] = useState("")

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")
  const [saveErr, setSaveErr] = useState("")

  const [activityType, setActivityType] = useState("Call")
  const [activityNotes, setActivityNotes] = useState("")
  const [nextFollowUp, setNextFollowUp] = useState("") // yyyy-mm-dd
  const [creating, setCreating] = useState(false)
  const [actMsg, setActMsg] = useState("")
  const [actErr, setActErr] = useState("")

  const mountedRef = useRef(true)

  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
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

  const normalizeContact = (record) => {
    if (!record || !record.fields) return record
    const f = record.fields

    const notes =
      f.Notes ??
      f["Notas"] ??
      f["Observaciones"] ??
      f["Notas (general)"] ??
      f["Permanent Notes"] ??
      f["Contact Notes"] ??
      ""

    const phone =
      f["Numero de telefono"] ??
      f["Número de teléfono"] ??
      f.Phone ??
      f["Telefono"] ??
      f["Teléfono"] ??
      ""

    const linkedin = f["LinkedIn URL"] ?? f["LinkedIn"] ?? f["Linkedin"] ?? ""

    return {
      ...record,
      fields: {
        ...f,
        Notes: notes,
        Phone: phone,
        "LinkedIn URL": linkedin
      }
    }
  }

  const toDateInputValue = (val) => {
    if (!val) return ""
    const s = String(val).trim()
    if (s.length >= 10 && s[4] === "-" && s[7] === "-") return s.slice(0, 10)
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (m) return `${m[3]}-${m[2]}-${m[1]}`
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) return ""
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  const normalizeDateForApi = (val) => {
    const v = String(val || "").trim()
    if (!v) return null
    if (v.length >= 10 && v[4] === "-" && v[7] === "-") return v.slice(0, 10)
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (m) return `${m[3]}-${m[2]}-${m[1]}`
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return null
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setLead(null)
    setActivities([])
    setErrLead("")
    setErrActs("")
    setSaveMsg("")
    setSaveErr("")
    setActMsg("")
    setActErr("")

    const leadAbort = new AbortController()
    const actAbort = new AbortController()

    loadLead(leadAbort.signal)
    loadActivities(actAbort.signal)

    return () => {
      leadAbort.abort()
      actAbort.abort()
    }
    // eslint-disable-next-line
  }, [id])

  const loadLead = async (signal) => {
    setLoadingLead(true)
    setErrLead("")
    try {
      const res = await fetch(`/api/crm?action=getContact&id=${id}`, {
        credentials: "include",
        signal
      })
      const data = await readJson(res)

      if (!mountedRef.current) return

      if (!res.ok) {
        setLead(null)
        setErrLead(safeErrMsg(data, "Failed to load lead"))
        setLoadingLead(false)
        return
      }

      setLead(normalizeContact(data))
      setLoadingLead(false)
    } catch (e) {
      if (!mountedRef.current) return
      if (e?.name === "AbortError") return
      setLead(null)
      setErrLead("Failed to load lead")
      setLoadingLead(false)
    }
  }

  const loadActivities = async (signal) => {
    setLoadingActs(true)
    setErrActs("")
    try {
      const res = await fetch(`/api/crm?action=getActivities&contactId=${id}`, {
        credentials: "include",
        signal
      })
      const data = await readJson(res)

      if (!mountedRef.current) return

      if (!res.ok) {
        setActivities([])
        setErrActs(safeErrMsg(data, "Failed to load activities"))
        setLoadingActs(false)
        return
      }

      setActivities(data.records || [])
      setLoadingActs(false)
    } catch (e) {
      if (!mountedRef.current) return
      if (e?.name === "AbortError") return
      setActivities([])
      setErrActs("Failed to load activities")
      setLoadingActs(false)
    }
  }

  const updateField = (field, value) => {
    setLead((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        fields: {
          ...prev.fields,
          [field]: value
        }
      }
    })
  }

  const saveChanges = async (e) => {
    e?.preventDefault?.()
    if (!lead?.fields) return

    setSaving(true)
    setSaveMsg("")
    setSaveErr("")

    try {
      const payload = {
        id,
        fields: {
          Email: lead.fields.Email || "",
          Position: lead.fields.Position || "",
          Status: lead.fields.Status || "Not Contacted",
          Notes: lead.fields.Notes || "",
          Phone: lead.fields.Phone || "",
          "LinkedIn URL": lead.fields["LinkedIn URL"] || ""
        }
      }

      const res = await fetch(`/api/crm?action=updateContact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      const data = await readJson(res)

      if (!res.ok) {
        setSaveErr(safeErrMsg(data, "Failed to update contact"))
        setSaving(false)
        return
      }

      setSaveMsg("Guardado ✅")

      const ctrl = new AbortController()
      await loadLead(ctrl.signal)
    } catch (err) {
      setSaveErr("Failed to update contact")
    }

    setSaving(false)
  }

  const createActivity = async (e) => {
    e?.preventDefault?.()

    setCreating(true)
    setActMsg("")
    setActErr("")

    try {
      const res = await fetch(`/api/crm?action=createActivity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contactId: id,
          type: activityType,
          notes: activityNotes || "",
          nextFollowUp: normalizeDateForApi(nextFollowUp)
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
      setActMsg("Actividad guardada ✅")

      const ctrl = new AbortController()
      await loadActivities(ctrl.signal)
    } catch {
      setActErr("Failed to create activity")
    }

    setCreating(false)
  }

  const computedNextFollowUp = useMemo(() => {
    const withNFU = (activities || []).find((a) => a?.fields?.["Next Follow-up Date"])
    return withNFU?.fields?.["Next Follow-up Date"] || ""
  }, [activities])

  const statusPill = useMemo(() => {
    const s = lead?.fields?.Status
    if (!s) return null
    return <span style={pill}>{s}</span>
  }, [lead?.fields?.Status])

  if (loadingLead) return <div style={loadingBox}>Loading...</div>

  if (errLead) {
    return (
      <div style={loadingBox}>
        <div style={errBox}>{errLead}</div>
        <button
          type="button"
          style={miniBtn}
          onClick={() => {
            const ctrl = new AbortController()
            loadLead(ctrl.signal)
            const ctrl2 = new AbortController()
            loadActivities(ctrl2.signal)
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!lead?.fields) {
    return (
      <div style={loadingBox}>
        <div style={errBox}>Lead not found</div>
      </div>
    )
  }

  const f = lead.fields

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

          <label style={label}>Next Follow-up (from Activities)</label>
          <input style={input} value={toDateInputValue(computedNextFollowUp)} readOnly />

          <label style={label}>Notes (general)</label>
          <textarea
            style={textarea}
            rows={5}
            value={f.Notes || ""}
            onChange={(e) => updateField("Notes", e.target.value)}
          />

          <button type="button" style={btn} onClick={saveChanges} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {saveErr ? <div style={errBox}>{saveErr}</div> : null}
          {saveMsg ? <div style={okBox}>{saveMsg}</div> : null}
        </div>

        {/* RIGHT */}
        <div style={card}>
          <h3 style={h3}>Add Activity</h3>

          <label style={label}>Outcome</label>
          <select
            style={input}
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
          >
            <option>Email</option>
            <option>Call</option>
            <option>LinkedIn</option>
            <option>Meeting</option>
            <option>Positive response</option>
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

          <button type="button" style={btn} onClick={createActivity} disabled={creating}>
            {creating ? "Saving..." : "Add Activity"}
          </button>

          {actErr ? <div style={errBox}>{actErr}</div> : null}
          {actMsg ? <div style={okBox}>{actMsg}</div> : null}

          <div style={timelineHeader}>
            <h3 style={{ margin: 0 }}>Activity Timeline</h3>
            <button
              type="button"
              style={miniBtn}
              onClick={() => {
                const ctrl = new AbortController()
                loadActivities(ctrl.signal)
              }}
            >
              Refresh
            </button>
          </div>

          {errActs ? <div style={errBox}>{errActs}</div> : null}

          {loadingActs ? (
            <div style={muted}>Loading activities...</div>
          ) : !activities.length ? (
            <div style={muted}>No activities yet.</div>
          ) : (
            activities.map((a) => {
              const outcome = a.fields?.Outcome ?? a.fields?.["Activity Type"] ?? "-"
              return (
                <div key={a.id} style={timelineItem}>
                  <div style={dot} />
                  <div>
                    <strong>{outcome}</strong>
                    <div style={note}>{a.fields?.Notes || ""}</div>

                    {a.fields?.["Next Follow-up Date"] ? (
                      <small style={date}>
                        Next FU: {toDateInputValue(a.fields?.["Next Follow-up Date"])}
                      </small>
                    ) : null}

                    <small style={date}>
                      {toDateInputValue(a.fields?.["Activity Date"] || "")}
                    </small>
                  </div>
                </div>
              )
            })
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
const errBox = { marginTop: 10, padding: 12, borderRadius: 14, background: "rgba(255,0,0,0.08)", color: "#7a1d1d", border: "1px solid rgba(255,0,0,0.12)" }
const okBox = { marginTop: 10, padding: 12, borderRadius: 14, background: "rgba(0,200,120,0.10)", color: "#0f5132", border: "1px solid rgba(0,200,120,0.16)" }
const timelineHeader = { marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }
const miniBtn = { padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.8)", fontWeight: 800, cursor: "pointer", fontSize: 12 }
const muted = { marginTop: 10, fontSize: 13, color: "rgba(0,0,0,0.55)" }
const timelineItem = { display: "flex", gap: 12, padding: 14, borderRadius: 18, background: "rgba(255,255,255,0.65)", border: "1px solid rgba(0,0,0,0.06)", marginTop: 10 }
const dot = { width: 10, height: 10, borderRadius: 999, marginTop: 6, background: "#145c43" }
const note = { marginTop: 6, fontSize: 13, color: "rgba(0,0,0,0.75)" }
const date = { display: "block", marginTop: 6, fontSize: 12, color: "rgba(0,0,0,0.55)" }
const loadingBox = { padding: 30 }
