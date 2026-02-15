/* =========================
   LEAD PROFILE (ESTÉTICA PF / MISMO LOOK QUE LEADS-COMPANIES-CALENDAR)
========================= */

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"

export function LeadProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

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

  const [timelineFilter, setTimelineFilter] = useState("All") // All | Overdue | With FU
  const [timelineSearch, setTimelineSearch] = useState("")

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

  const dedupeById = (list = []) => {
    const map = new Map()
    for (const item of list) {
      if (!item?.id) continue
      map.set(item.id, item)
    }
    return Array.from(map.values())
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
    setTimelineSearch("")
    setTimelineFilter("All")

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

      const recs = data.records || []
      setActivities(dedupeById(recs))
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

      setSaveMsg("Saved ✅")
      const ctrl = new AbortController()
      await loadLead(ctrl.signal)
    } catch {
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

      setActivities((prev) => dedupeById([data, ...(prev || [])]))

      setActivityNotes("")
      setNextFollowUp("")
      setActMsg("Activity saved ✅")

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

  const statusPillEl = useMemo(() => {
    const s = lead?.fields?.Status
    if (!s) return null
    return <span style={{ ...statusPill, ...statusColor(s) }}>{s}</span>
  }, [lead?.fields?.Status])

  const normalizedTimeline = useMemo(() => {
    const now = new Date()
    return (activities || [])
      .map((a) => {
        const f = a?.fields || {}
        const type = f.Outcome ?? f["Activity Type"] ?? "-"
        const notes = f.Notes || ""
        const actDate = f["Activity Date"] || ""
        const fu = f["Next Follow-up Date"] || ""
        const dFU = fu ? new Date(fu) : null
        const overdue = !!dFU && dFU < now
        return { id: a.id, raw: a, type, notes, actDate, fu, overdue }
      })
      .sort((a, b) => {
        const at = a.fu ? new Date(a.fu).getTime() : -1
        const bt = b.fu ? new Date(b.fu).getTime() : -1
        if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
        if (at !== bt) return bt - at
        const ad = a.actDate ? new Date(a.actDate).getTime() : 0
        const bd = b.actDate ? new Date(b.actDate).getTime() : 0
        return bd - ad
      })
  }, [activities])

  const timelineFiltered = useMemo(() => {
    const q = String(timelineSearch || "").trim().toLowerCase()
    let list = normalizedTimeline

    if (timelineFilter === "Overdue") list = list.filter((x) => x.overdue)
    if (timelineFilter === "With FU") list = list.filter((x) => !!x.fu)

    if (!q) return list
    return list.filter((x) => {
      return (
        String(x.type || "").toLowerCase().includes(q) ||
        String(x.notes || "").toLowerCase().includes(q) ||
        String(x.actDate || "").toLowerCase().includes(q) ||
        String(x.fu || "").toLowerCase().includes(q)
      )
    })
  }, [normalizedTimeline, timelineFilter, timelineSearch])

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
      {/* TOP BAR */}
      <div style={head}>
        <div style={{ minWidth: 0 }}>
          <div style={crumbs}>
            <button style={crumbBtn} onClick={() => navigate("/leads")} type="button">
              Leads
            </button>
            <span style={crumbSep}>/</span>
            <span style={crumbCurrent}>{f["Full Name"] || "Lead"}</span>
          </div>

          <div style={heroLine}>
            <h1 style={title}>{f["Full Name"] || "Lead"}</h1>
            <div style={topRight}>
              {statusPillEl}
              <span style={mutedSmall}>
                {loadingActs ? "Loading activity..." : activities.length ? "" : "No activity yet"}
              </span>
            </div>
          </div>

          <div style={subLine}>
            <span style={subPill}>{f.Position || "—"}</span>
            <span style={subDot}>•</span>
            <span style={subPill}>{f.CompanyName || f.Company || "—"}</span>
            {f["LinkedIn URL"] ? (
              <>
                <span style={subDot}>•</span>
                <a
                  href={f["LinkedIn URL"]}
                  target="_blank"
                  rel="noreferrer"
                  style={subLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  LinkedIn ↗
                </a>
              </>
            ) : null}
          </div>
        </div>

        <div style={headActions}>
          <button style={ghostBtn} type="button" onClick={saveChanges} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            style={ghostBtn}
            type="button"
            onClick={() => {
              const ctrl = new AbortController()
              loadLead(ctrl.signal)
              const ctrl2 = new AbortController()
              loadActivities(ctrl2.signal)
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {saveErr ? <div style={errBox}>{saveErr}</div> : null}
      {saveMsg ? <div style={okBox}>{saveMsg}</div> : null}

      <div style={grid}>
        {/* LEFT: CONTACT */}
        <div style={card}>
          <div style={cardHeader}>
            <h3 style={h3}>Contact Info</h3>
            <span style={hint}>Edit fields and save</span>
          </div>

          <div style={formGrid}>
            <div style={field}>
              <label style={label}>Email</label>
              <input
                style={input}
                value={f.Email || ""}
                onChange={(e) => updateField("Email", e.target.value)}
                placeholder="email@company.com"
              />
            </div>

            <div style={field}>
              <label style={label}>Phone</label>
              <input
                style={input}
                value={f.Phone || ""}
                onChange={(e) => updateField("Phone", e.target.value)}
                placeholder="+34 ..."
              />
            </div>

            <div style={field}>
              <label style={label}>Position</label>
              <input
                style={input}
                value={f.Position || ""}
                onChange={(e) => updateField("Position", e.target.value)}
                placeholder="Founder / Head of Growth..."
              />
            </div>

            <div style={field}>
              <label style={label}>LinkedIn</label>
              <input
                style={input}
                value={f["LinkedIn URL"] || ""}
                onChange={(e) => updateField("LinkedIn URL", e.target.value)}
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div style={{ ...field, gridColumn: "1 / -1" }}>
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
            </div>

            <div style={{ ...field, gridColumn: "1 / -1" }}>
              <label style={label}>Next Follow-up (from Activities)</label>
              <input style={input} value={toDateInputValue(computedNextFollowUp)} readOnly />
            </div>

            <div style={{ ...field, gridColumn: "1 / -1" }}>
              <label style={label}>Notes (general)</label>
              <textarea
                style={textarea}
                rows={6}
                value={f.Notes || ""}
                onChange={(e) => updateField("Notes", e.target.value)}
                placeholder="Context, objections, decisions, next steps..."
              />
            </div>
          </div>
        </div>

        {/* RIGHT: ACTIVITIES */}
        <div style={card}>
          <div style={cardHeader}>
            <h3 style={h3}>Add Activity</h3>
            <span style={hint}>Saved into Airtable + timeline</span>
          </div>

          <div style={formGrid}>
            <div style={field}>
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
            </div>

            <div style={field}>
              <label style={label}>Next follow-up</label>
              <input
                style={input}
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
              />
            </div>

            <div style={{ ...field, gridColumn: "1 / -1" }}>
              <label style={label}>Activity notes</label>
              <textarea
                style={textarea}
                rows={4}
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                placeholder="What happened, result, next step..."
              />
            </div>

            <div style={{ display: "flex", gap: 10, gridColumn: "1 / -1" }}>
              <button type="button" style={btn} onClick={createActivity} disabled={creating}>
                {creating ? "Saving..." : "Add Activity"}
              </button>
              <button
                type="button"
                style={ghostBtnSmall}
                onClick={() => {
                  setActivityNotes("")
                  setNextFollowUp("")
                  setActMsg("")
                  setActErr("")
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {actErr ? <div style={errBox}>{actErr}</div> : null}
          {actMsg ? <div style={okBox}>{actMsg}</div> : null}
          {errActs ? <div style={errBox}>{errActs}</div> : null}

          <div style={timelineHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={timelineTitle}>Activity Timeline</div>

              <div style={chipRow}>
                <button
                  type="button"
                  onClick={() => setTimelineFilter("All")}
                  style={{ ...chip, ...(timelineFilter === "All" ? chipOn : {}) }}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineFilter("Overdue")}
                  style={{ ...chip, ...(timelineFilter === "Overdue" ? chipDanger : {}) }}
                >
                  Overdue
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineFilter("With FU")}
                  style={{ ...chip, ...(timelineFilter === "With FU" ? chipOn : {}) }}
                >
                  With follow-up
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                style={searchMini}
                placeholder="Search timeline..."
                value={timelineSearch}
                onChange={(e) => setTimelineSearch(e.target.value)}
              />
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
          </div>

          {loadingActs ? (
            <div style={muted}>Loading activities...</div>
          ) : !timelineFiltered.length ? (
            <div style={muted}>No activities yet.</div>
          ) : (
            <div style={timelineList}>
              {timelineFiltered.map((a) => (
                <div key={a.id} style={timelineItem}>
                  <div style={{ ...dot, ...(a.overdue ? dotDanger : {}) }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={timelineTop}>
                      <strong style={timelineStrong}>{a.type}</strong>
                      {a.overdue ? <span style={{ ...statusPill, ...pillOverdue }}>Overdue</span> : null}
                    </div>

                    {a.notes ? <div style={note}>{a.notes}</div> : <div style={noteMuted}>—</div>}

                    <div style={dateRow}>
                      {a.fu ? (
                        <span style={datePill}>Next FU: {toDateInputValue(a.fu)}</span>
                      ) : null}
                      <span style={datePill}>{toDateInputValue(a.actDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* =========================
   COMPANY PROFILE (MISMA ESTÉTICA)
========================= */

export function CompanyProfile() {
  const { id } = useParams()

  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")
  const [msg, setMsg] = useState("")

  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const safeErrMsg = (data, fallback) =>
    data?.error ||
    data?.details?.error?.message ||
    data?.details?.error ||
    data?.details?.message ||
    fallback

  useEffect(() => {
    const ctrl = new AbortController()
    loadCompany(ctrl.signal)
    return () => ctrl.abort()
    // eslint-disable-next-line
  }, [id])

  const loadCompany = async (signal) => {
    setLoading(true)
    setErr("")
    setMsg("")
    try {
      const res = await fetch(`/api/crm?action=getCompany&id=${id}`, {
        credentials: "include",
        signal
      })
      const data = await readJson(res)

      if (!res.ok) {
        setCompany(null)
        setErr(safeErrMsg(data, "Failed to load company"))
        setLoading(false)
        return
      }

      setCompany(data)
      setLoading(false)
    } catch (e) {
      if (e?.name === "AbortError") return
      setCompany(null)
      setErr("Failed to load company")
      setLoading(false)
    }
  }

  const updateField = (field, value) => {
    setCompany((prev) => ({
      ...prev,
      fields: {
        ...(prev?.fields || {}),
        [field]: value
      }
    }))
  }

  const saveChanges = async () => {
    if (!company?.fields) return
    setSaving(true)
    setErr("")
    setMsg("")

    try {
      const payload = {
        id,
        fields: {
          "Company Name": company.fields["Company Name"] || company.fields["Name"] || "",
          Industry: company.fields.Industry || "",
          Country: company.fields.Country || "",
          Status: company.fields.Status || "New",
          "Responsible Email": company.fields["Responsible Email"] || ""
        }
      }

      const res = await fetch("/api/crm?action=updateCompany", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      })

      const data = await readJson(res)

      if (!res.ok) {
        setErr(safeErrMsg(data, "Failed to update company"))
        setSaving(false)
        return
      }

      setMsg("Saved ✅")
      const ctrl = new AbortController()
      await loadCompany(ctrl.signal)
    } catch {
      setErr("Failed to update company")
    }

    setSaving(false)
  }

  if (loading) return <div style={loadingBox}>Loading...</div>

  if (err) {
    return (
      <div style={page}>
        <div style={errBox}>{err}</div>
        <button
          type="button"
          style={miniBtn}
          onClick={() => {
            const ctrl = new AbortController()
            loadCompany(ctrl.signal)
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!company?.fields) {
    return (
      <div style={page}>
        <div style={errBox}>Company not found</div>
      </div>
    )
  }

  const f = company.fields
  const name = f["Company Name"] || f["Name"] || "Company"
  const website = f["Website"] || f["URL"] || ""

  return (
    <div style={page}>
      <div style={head}>
        <div style={{ minWidth: 0 }}>
          <div style={heroLine}>
            <h1 style={title}>{name}</h1>
            <div style={topRight}>
              {f.Status ? <span style={{ ...statusPill, ...statusColorCompany(f.Status) }}>{f.Status}</span> : null}
            </div>
          </div>

          <div style={subLine}>
            <span style={subPill}>{f.Industry || "—"}</span>
            <span style={subDot}>•</span>
            <span style={subPill}>{f.Country || "—"}</span>
            {website ? (
              <>
                <span style={subDot}>•</span>
                <a href={safeUrl(website)} target="_blank" rel="noreferrer" style={subLink}>
                  Website ↗
                </a>
              </>
            ) : null}
          </div>
        </div>

        <div style={headActions}>
          <button style={ghostBtn} type="button" onClick={saveChanges} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            style={ghostBtn}
            type="button"
            onClick={() => {
              const ctrl = new AbortController()
              loadCompany(ctrl.signal)
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {msg ? <div style={okBox}>{msg}</div> : null}
      {err ? <div style={errBox}>{err}</div> : null}

      <div style={gridOne}>
        <div style={card}>
          <div style={cardHeader}>
            <h3 style={h3}>Company Info</h3>
            <span style={hint}>Edit fields and save</span>
          </div>

          <div style={formGrid}>
            <div style={{ ...field, gridColumn: "1 / -1" }}>
              <label style={label}>Company Name</label>
              <input
                style={input}
                value={f["Company Name"] || f["Name"] || ""}
                onChange={(e) => updateField("Company Name", e.target.value)}
              />
            </div>

            <div style={field}>
              <label style={label}>Industry</label>
              <input
                style={input}
                value={f.Industry || ""}
                onChange={(e) => updateField("Industry", e.target.value)}
              />
            </div>

            <div style={field}>
              <label style={label}>Country</label>
              <input
                style={input}
                value={f.Country || ""}
                onChange={(e) => updateField("Country", e.target.value)}
              />
            </div>

            <div style={field}>
              <label style={label}>Status</label>
              <select
                style={input}
                value={f.Status || "New"}
                onChange={(e) => updateField("Status", e.target.value)}
              >
                <option>New</option>
                <option>Contacted</option>
                <option>Replied</option>
                <option>Meeting Booked</option>
                <option>Closed Won</option>
                <option>Closed Lost</option>
              </select>
            </div>

            <div style={field}>
              <label style={label}>Responsible Email</label>
              <input
                style={input}
                value={f["Responsible Email"] || ""}
                onChange={(e) => updateField("Responsible Email", e.target.value)}
                placeholder="owner@company.com"
              />
            </div>

            {website ? (
              <div style={{ ...field, gridColumn: "1 / -1" }}>
                <label style={label}>Website</label>
                <a
                  style={siteBtn}
                  href={safeUrl(website)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open website ↗
                </a>
              </div>
            ) : null}
          </div>

          <button type="button" style={btn} onClick={saveChanges} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================
   HELPERS
========================= */

function safeUrl(url) {
  const s = String(url || "").trim()
  if (!s) return "#"
  if (s.startsWith("http://") || s.startsWith("https://")) return s
  return `https://${s}`
}

function statusColor(s) {
  const v = String(s || "")
  if (v === "Meeting Booked") return { background: "rgba(30,180,90,0.18)", borderColor: "rgba(30,180,90,0.35)", color: "#0f5132" }
  if (v === "Replied") return { background: "rgba(80,70,210,0.16)", borderColor: "rgba(80,70,210,0.30)", color: "#2b2a7a" }
  if (v === "Contacted") return { background: "rgba(20,120,255,0.14)", borderColor: "rgba(20,120,255,0.26)", color: "#0b3a8a" }
  if (v === "Closed Won") return { background: "rgba(0,200,120,0.18)", borderColor: "rgba(0,200,120,0.35)", color: "#0f5132" }
  if (v === "Closed Lost") return { background: "rgba(255,0,0,0.10)", borderColor: "rgba(255,0,0,0.18)", color: "#7a1d1d" }
  return { background: "rgba(0,0,0,0.06)", borderColor: "rgba(0,0,0,0.10)", color: "rgba(0,0,0,0.70)" }
}

function statusColorCompany(s) {
  const v = String(s || "")
  if (v === "Closed Won") return { background: "rgba(0,200,120,0.18)", borderColor: "rgba(0,200,120,0.35)", color: "#0f5132" }
  if (v === "Closed Lost") return { background: "rgba(255,0,0,0.10)", borderColor: "rgba(255,0,0,0.18)", color: "#7a1d1d" }
  if (v === "Meeting Booked") return { background: "rgba(30,180,90,0.18)", borderColor: "rgba(30,180,90,0.35)", color: "#0f5132" }
  if (v === "Replied") return { background: "rgba(80,70,210,0.16)", borderColor: "rgba(80,70,210,0.30)", color: "#2b2a7a" }
  if (v === "Contacted") return { background: "rgba(20,120,255,0.14)", borderColor: "rgba(20,120,255,0.26)", color: "#0b3a8a" }
  return { background: "rgba(0,0,0,0.06)", borderColor: "rgba(0,0,0,0.10)", color: "rgba(0,0,0,0.70)" }
}

/* =========================
   STYLES (UNIFICADOS)
========================= */

const page = { width: "100%" }

const head = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 14
}

const headActions = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }

const crumbs = { display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }
const crumbBtn = {
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontWeight: 900,
  color: "rgba(0,0,0,0.55)"
}
const crumbSep = { color: "rgba(0,0,0,0.25)", fontWeight: 900 }
const crumbCurrent = { fontWeight: 950, color: "#0f3d2e" }

const heroLine = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }

const title = {
  fontSize: 40,
  fontWeight: 900,
  color: "#0f3d2e",
  margin: 0
}

const topRight = { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }

const mutedSmall = { fontSize: 12, color: "rgba(0,0,0,0.5)", fontWeight: 800 }

const subLine = { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }
const subDot = { color: "rgba(0,0,0,0.20)", fontWeight: 900 }
const subPill = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(0,0,0,0.06)",
  fontWeight: 900,
  color: "rgba(0,0,0,0.70)"
}
const subLink = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(20,92,67,0.10)",
  border: "1px solid rgba(20,92,67,0.18)",
  fontWeight: 900,
  color: "#145c43",
  textDecoration: "none"
}

const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }
const gridOne = { display: "grid", gridTemplateColumns: "1fr", gap: 26, maxWidth: 820 }

const card = {
  padding: 22,
  borderRadius: 26,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.45)",
  boxShadow: "0 12px 36px rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 14
}

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 12,
  flexWrap: "wrap"
}

const h3 = { margin: 0, fontSize: 18, fontWeight: 950, color: "#145c43" }
const hint = { fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,0.50)" }

const formGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12
}

const field = { display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }

const label = { fontSize: 12, color: "rgba(0,0,0,0.6)", fontWeight: 900 }

const input = {
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.80)",
  outline: "none",
  fontWeight: 800,
  color: "rgba(0,0,0,0.80)"
}

const textarea = {
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.80)",
  outline: "none",
  fontWeight: 700,
  color: "rgba(0,0,0,0.78)",
  resize: "vertical"
}

const btn = {
  marginTop: 4,
  padding: 14,
  borderRadius: 18,
  border: "none",
  background: "#0b0b0b",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer"
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

const ghostBtnSmall = {
  padding: "12px 14px",
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(18px)",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12
}

const miniBtn = {
  padding: "10px 12px",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.70)",
  backdropFilter: "blur(18px)",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12
}

const statusPill = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.10)",
  fontWeight: 950,
  fontSize: 12,
  whiteSpace: "nowrap"
}

const pillOverdue = {
  background: "rgba(255,0,0,0.08)",
  borderColor: "rgba(255,0,0,0.12)",
  color: "#7a1d1d"
}

const errBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)"
}

const okBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(0,200,120,0.10)",
  color: "#0f5132",
  border: "1px solid rgba(0,200,120,0.16)"
}

const muted = { marginTop: 10, fontSize: 13, color: "rgba(0,0,0,0.55)", fontWeight: 800 }

const timelineHeader = {
  marginTop: 6,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap"
}

const timelineTitle = { fontWeight: 950, color: "#0f3d2e" }

const searchMini = {
  padding: "10px 12px",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(18px)",
  outline: "none",
  fontWeight: 800,
  fontSize: 12,
  width: 220,
  maxWidth: "55vw"
}

const chipRow = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }
const chip = {
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.70)",
  cursor: "pointer",
  fontWeight: 950,
  fontSize: 12,
  color: "rgba(0,0,0,0.70)"
}
const chipOn = {
  borderColor: "rgba(20,92,67,0.18)",
  background: "rgba(20,92,67,0.10)",
  color: "#145c43"
}
const chipDanger = {
  borderColor: "rgba(255,0,0,0.14)",
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d"
}

const timelineList = { marginTop: 6, display: "flex", flexDirection: "column", gap: 10 }

const timelineItem = {
  display: "flex",
  gap: 12,
  padding: 14,
  borderRadius: 18,
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(0,0,0,0.06)"
}

const dot = { width: 10, height: 10, borderRadius: 999, marginTop: 6, background: "#145c43" }
const dotDanger = { background: "#ff3b30" }

const timelineTop = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }
const timelineStrong = { color: "#0b1f18" }

const note = { marginTop: 6, fontSize: 13, color: "rgba(0,0,0,0.75)", fontWeight: 700, lineHeight: 1.35 }
const noteMuted = { marginTop: 6, fontSize: 13, color: "rgba(0,0,0,0.45)", fontWeight: 800 }

const dateRow = { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }
const datePill = {
  fontSize: 12,
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.06)",
  color: "rgba(0,0,0,0.70)",
  fontWeight: 900
}

const siteBtn = {
  width: "fit-content",
  padding: "10px 12px",
  borderRadius: 16,
  border: "1px solid rgba(20,92,67,0.20)",
  background: "rgba(20,92,67,0.10)",
  color: "#145c43",
  fontWeight: 950,
  textDecoration: "none"
}

const loadingBox = { padding: 30 }
