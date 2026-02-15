export default async function handler(req, res) {
  try {
    const { action } = req.query

    const body =
      req.method === "POST"
        ? typeof req.body === "string"
          ? JSON.parse(req.body || "{}")
          : req.body
        : {}

    const baseId = process.env.AIRTABLE_BASE_ID
    const token = process.env.AIRTABLE_TOKEN

    if (!baseId || !token) {
      return res.status(500).json({ error: "Missing Airtable configuration" })
    }

    const AIRTABLE_HEADERS = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }

    res.setHeader("Cache-Control", "no-store")

    /* =====================================================
       HELPERS
    ====================================================== */

    const readJson = async (r) => {
      try {
        return await r.json()
      } catch {
        return {}
      }
    }

    const normalizeEmail = (v) => String(v || "").trim().toLowerCase()

    const getSessionEmail = () => {
      const cookie = req.headers.cookie
      if (!cookie) return null
      if (!cookie.includes("session=")) return null
      return normalizeEmail(cookie.split("session=")[1]?.split(";")[0])
    }

    const requireAuth = () => {
      const email = getSessionEmail()
      if (!email) {
        res.status(401).json({ error: "Not authenticated" })
        return null
      }
      return email
    }

    const secureCookieFlags =
      process.env.NODE_ENV === "production"
        ? "HttpOnly; Secure; SameSite=Lax; Path=/"
        : "HttpOnly; SameSite=Lax; Path=/"

    const normalizeDate = (val) => {
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

    const fetchAllAirtableRecords = async (tableName, params = {}) => {
      const out = []
      let offset = null

      while (true) {
        const usp = new URLSearchParams()
        Object.entries(params).forEach(([k, v]) => {
          if (v === undefined || v === null || v === "") return
          usp.set(k, v)
        })
        if (offset) usp.set("offset", offset)

        const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
          tableName
        )}?${usp.toString()}`

        const r = await fetch(url, { headers: AIRTABLE_HEADERS })
        const data = await readJson(r)

        if (!r.ok) {
          const err = data || {}
          const msg = err?.error?.message || err?.error || "Airtable error"
          throw Object.assign(new Error(msg), { status: r.status, details: err })
        }

        out.push(...(data.records || []))
        offset = data.offset
        if (!offset) break
      }

      return out
    }

    const isOwner = (record, email) => {
      const owner = normalizeEmail(record?.fields?.["Responsible Email"])
      return owner && owner === normalizeEmail(email)
    }

    /* =====================================================
       PATCH robusto: manda SIEMPRE Notes aunque esté vacío
       y usa fallbacks si el nombre real del campo es distinto
    ====================================================== */

    const patchWithFieldFallbacks = async (table, id, fields) => {
      const attempt = async (payloadFields) => {
        const r = await fetch(`https://api.airtable.com/v0/${baseId}/${table}/${id}`, {
          method: "PATCH",
          headers: AIRTABLE_HEADERS,
          body: JSON.stringify({ fields: payloadFields })
        })
        const data = await readJson(r)
        return { ok: r.ok, status: r.status, data }
      }

      // 1) intento directo
      let r1 = await attempt(fields)
      if (r1.ok) return r1

      const errType = r1.data?.error?.type
      if (errType !== "UNKNOWN_FIELD_NAME") return r1

      const variants = []

      // Notes variants
      if (Object.prototype.hasOwnProperty.call(fields, "Notes")) {
        const base = { ...fields }
        const val = base.Notes
        delete base.Notes
        variants.push({ ...base, "Notas": val })
        variants.push({ ...base, "Observaciones": val })
        variants.push({ ...base, "Notas (general)": val })
        variants.push({ ...base, "Notes (general)": val })
        variants.push({ ...base, "Permanent Notes": val })
        variants.push({ ...base, "Contact Notes": val })
      }

      // Phone variants
      if (Object.prototype.hasOwnProperty.call(fields, "Phone")) {
        const base = { ...fields }
        const val = base.Phone
        delete base.Phone
        variants.push({ ...base, "Numero de telefono": val })
        variants.push({ ...base, "Número de teléfono": val })
        variants.push({ ...base, "Telefono": val })
        variants.push({ ...base, "Teléfono": val })
      }

      // LinkedIn variants
      if (Object.prototype.hasOwnProperty.call(fields, "LinkedIn URL")) {
        const base = { ...fields }
        const val = base["LinkedIn URL"]
        delete base["LinkedIn URL"]
        variants.push({ ...base, LinkedIn: val })
        variants.push({ ...base, Linkedin: val })
      }

      // Status variants
      if (Object.prototype.hasOwnProperty.call(fields, "Status")) {
        const base = { ...fields }
        const val = base.Status
        delete base.Status
        variants.push({ ...base, Estado: val })
      }

      // Position variants
      if (Object.prototype.hasOwnProperty.call(fields, "Position")) {
        const base = { ...fields }
        const val = base.Position
        delete base.Position
        variants.push({ ...base, Puesto: val })
        variants.push({ ...base, Cargo: val })
      }

      // Email variants
      if (Object.prototype.hasOwnProperty.call(fields, "Email")) {
        const base = { ...fields }
        const val = base.Email
        delete base.Email
        variants.push({ ...base, "E-mail": val })
        variants.push({ ...base, Mail: val })
      }

      for (const v of variants) {
        const rx = await attempt(v)
        if (rx.ok) return rx
      }

      return r1
    }

    /* =====================================================
       CREATE (POST) con fallbacks (ACTIVITIES)
    ====================================================== */

    const createWithFallbacks = async (table, fields) => {
      const attempt = async (payloadFields) => {
        const r = await fetch(`https://api.airtable.com/v0/${baseId}/${table}`, {
          method: "POST",
          headers: AIRTABLE_HEADERS,
          body: JSON.stringify({ fields: payloadFields })
        })
        const data = await readJson(r)
        return { ok: r.ok, status: r.status, data }
      }

      let r1 = await attempt(fields)
      if (r1.ok) return r1

      const type = r1.data?.error?.type
      const variants = []

      if ("Outcome" in fields) {
        const base = { ...fields }
        const val = base.Outcome
        delete base.Outcome
        variants.push({ ...base, "Activity Type": val })
      }
      if ("Activity Type" in fields) {
        const base = { ...fields }
        const val = base["Activity Type"]
        delete base["Activity Type"]
        variants.push({ ...base, Outcome: val })
      }

      if ("Activity Date" in fields) {
        const base = { ...fields }
        base["Activity Date"] = normalizeDate(base["Activity Date"])
        variants.push(base)
      }

      if ("Notes" in fields) {
        const base = { ...fields }
        const val = base.Notes
        delete base.Notes
        variants.push({ ...base, Notas: val })
        variants.push({ ...base, Observaciones: val })
      }

      if (type === "UNKNOWN_FIELD_NAME" || type === "INVALID_VALUE_FOR_COLUMN") {
        for (const v of variants) {
          const rx = await attempt(v)
          if (rx.ok) return rx
        }
      } else {
        for (const v of variants.slice(0, 2)) {
          const rx = await attempt(v)
          if (rx.ok) return rx
        }
      }

      return r1
    }

    /* =====================================================
       LOGIN (NO AUTH REQUIRED)
    ====================================================== */

    if (action === "login") {
      const { email } = body

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email required" })
      }

      const normalized = normalizeEmail(email)

      const allowedUsers = [
        "benjamin.alegre@psicofunnel.com",
        "sarahduatorrss@gmail.com"
      ]

      if (!allowedUsers.includes(normalized)) {
        return res.status(401).json({ error: "Not authorized" })
      }

      const expires = new Date()
      expires.setDate(expires.getDate() + 7)

      res.setHeader(
        "Set-Cookie",
        `session=${normalized}; ${secureCookieFlags}; Expires=${expires.toUTCString()}`
      )

      return res.status(200).json({ success: true })
    }

    /* =====================================================
       AUTH REQUIRED BELOW
    ====================================================== */

    const email = requireAuth()
    if (!email) return

    /* =====================================================
       GET CONTACT
    ====================================================== */

    if (action === "getContact") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing contact ID" })

      const r = await fetch(`https://api.airtable.com/v0/${baseId}/Contacts/${id}`, {
        headers: AIRTABLE_HEADERS
      })
      const data = await readJson(r)

      if (!r.ok) return res.status(r.status).json({ error: "Contact not found", details: data })
      if (!isOwner(data, email)) return res.status(403).json({ error: "Forbidden" })

      return res.status(200).json(data)
    }

    /* =====================================================
       UPDATE CONTACT ✅✅ arreglado (Notes vacío)
    ====================================================== */

    if (action === "updateContact") {
      const { id, fields } = body
      if (!id || !fields) return res.status(400).json({ error: "Missing data" })

      const check = await fetch(`https://api.airtable.com/v0/${baseId}/Contacts/${id}`, {
        headers: AIRTABLE_HEADERS
      })
      const existing = await readJson(check)

      if (!check.ok) {
        return res.status(check.status).json({ error: "Contact not found", details: existing })
      }

      if (!isOwner(existing, email)) {
        return res.status(403).json({ error: "Forbidden" })
      }

      // ✅ Mandamos SIEMPRE el campo Notes (aunque sea string vacío)
      const safeFields = {
        Email: fields.Email ?? "",
        Position: fields.Position ?? "",
        Status: fields.Status ?? "Not Contacted",
        Notes: String(fields.Notes ?? ""),
        Phone: fields.Phone ?? "",
        "LinkedIn URL": fields["LinkedIn URL"] ?? ""
      }

      const r = await patchWithFieldFallbacks("Contacts", id, safeFields)

      if (!r.ok) {
        return res.status(r.status).json({ error: "Failed to update contact", details: r.data })
      }

      return res.status(200).json(r.data)
    }

    /* =====================================================
       CREATE ACTIVITY
    ====================================================== */

    if (action === "createActivity") {
      const { contactId, type, notes, nextFollowUp } = body
      if (!contactId || !type) return res.status(400).json({ error: "Missing required fields" })

      const contactRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/Contacts/${contactId}`,
        { headers: AIRTABLE_HEADERS }
      )
      const contactData = await readJson(contactRes)

      if (!contactRes.ok) {
        return res.status(contactRes.status).json({
          error: "Failed to fetch contact for activity",
          details: contactData
        })
      }

      if (!isOwner(contactData, email)) return res.status(403).json({ error: "Forbidden" })

      const rawCompany = contactData.fields?.Company
      const candidate = Array.isArray(rawCompany) && rawCompany.length > 0 ? rawCompany[0] : null
      const linkedCompanyId = typeof candidate === "string" && candidate.startsWith("rec") ? candidate : null

      const fieldsToSend = {
        Outcome: String(type),
        "Related Contact": [contactId],
        "Activity Date": normalizeDate(new Date()),
        "Owner Email": normalizeEmail(email),
        Notes: String(notes || "")
      }

      const nfu = normalizeDate(nextFollowUp)
      if (nfu) fieldsToSend["Next Follow-up Date"] = nfu
      if (linkedCompanyId) fieldsToSend["Related Company"] = [linkedCompanyId]

      const r = await createWithFallbacks("Activities", fieldsToSend)

      if (!r.ok) {
        return res.status(r.status).json({ error: "Failed to create activity", details: r.data })
      }

      return res.status(200).json(r.data)
    }

    /* =====================================================
       GET ACTIVITIES (robusto)
    ====================================================== */

    if (action === "getActivities") {
      const { contactId } = req.query
      if (!contactId) return res.status(400).json({ error: "Missing contact ID" })

      try {
        const contactRes = await fetch(`https://api.airtable.com/v0/${baseId}/Contacts/${contactId}`, {
          headers: AIRTABLE_HEADERS
        })
        const contactData = await readJson(contactRes)

        if (!contactRes.ok) {
          return res.status(contactRes.status).json({ error: "Contact not found", details: contactData })
        }

        if (!isOwner(contactData, email)) return res.status(403).json({ error: "Forbidden" })

        const contactName =
          contactData.fields?.["Full Name"] ||
          contactData.fields?.["Name"] ||
          contactData.fields?.["Contact Name"] ||
          ""

        const ownerFormula = `{Owner Email}="${normalizeEmail(email)}"`
        const all = await fetchAllAirtableRecords("Activities", { filterByFormula: ownerFormula })

        const filtered = (all || []).filter((rec) => {
          const f = rec.fields || {}
          const rel = f["Related Contact"]
          if (Array.isArray(rel) && rel.includes(contactId)) return true
          const relStr = Array.isArray(rel) ? rel.join(" ") : String(rel || "")
          if (relStr.includes(contactId)) return true
          if (contactName && relStr.toLowerCase().includes(String(contactName).toLowerCase())) return true
          return false
        })

        filtered.sort((a, b) => {
          const da = new Date(a.fields?.["Activity Date"] || 0).getTime()
          const db = new Date(b.fields?.["Activity Date"] || 0).getTime()
          return db - da
        })

        return res.status(200).json({ records: filtered })
      } catch (e) {
        return res.status(e.status || 500).json({
          error: "Failed to fetch activities",
          details: e.details || String(e.message || e)
        })
      }
    }

    return res.status(400).json({ error: "Invalid action" })
  } catch (err) {
    console.error("CRM BACKEND ERROR:", err)
    return res.status(500).json({
      error: "Internal server error",
      details: String(err?.message || err)
    })
  }
}
