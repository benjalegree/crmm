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

    const getSessionEmail = () => {
      const cookie = req.headers.cookie
      if (!cookie) return null
      if (!cookie.includes("session=")) return null
      return cookie
        .split("session=")[1]
        ?.split(";")[0]
        ?.trim()
        ?.toLowerCase()
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
      // devuelve "YYYY-MM-DD" o null
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

    // Airtable list con paginación offset
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

    const forbidIfNotOwner = (record, email) => {
      if (!record?.fields) return false
      return record.fields["Responsible Email"] !== email
    }

    // ✅ helper: elige el nombre real del campo en Airtable
    const pickExistingFieldName = (existingFields, candidates = []) => {
      const keys = new Set(Object.keys(existingFields || {}))
      for (const c of candidates) {
        if (keys.has(c)) return c
      }
      return null
    }

    // ✅ arma fields para PATCH sin romper si no existe el campo
    const buildSafeContactPatchFields = (existingFields, incoming = {}) => {
      const out = {}

      if ("Email" in incoming) {
        const k = pickExistingFieldName(existingFields, ["Email", "E-mail", "Mail"])
        if (k) out[k] = String(incoming.Email || "")
      }

      if ("Position" in incoming) {
        const k = pickExistingFieldName(existingFields, ["Position", "Puesto", "Cargo"])
        if (k) out[k] = String(incoming.Position || "")
      }

      if ("Status" in incoming) {
        const k = pickExistingFieldName(existingFields, ["Status", "Estado"])
        if (k) out[k] = String(incoming.Status || "")
      }

      if ("Notes" in incoming) {
        const k = pickExistingFieldName(existingFields, [
          "Notes",
          "Notas",
          "Observaciones",
          "Contact Notes",
          "Permanent Notes"
        ])
        if (k) out[k] = String(incoming.Notes || "")
      }

      if ("Phone" in incoming) {
        const k = pickExistingFieldName(existingFields, [
          "Numero de telefono",
          "Número de teléfono",
          "Phone",
          "Telefono",
          "Teléfono"
        ])
        if (k) out[k] = String(incoming.Phone || "")
      }

      if ("LinkedIn URL" in incoming) {
        const k = pickExistingFieldName(existingFields, [
          "LinkedIn URL",
          "LinkedIn",
          "Linkedin"
        ])
        if (k) out[k] = String(incoming["LinkedIn URL"] || "")
      }

      // 🚫 NO guardamos Next Follow-up Date en Contacts
      return out
    }

    // ✅ CREATE (POST) con fallbacks por nombres de campos
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

      // 1) intento directo
      let r1 = await attempt(fields)
      if (r1.ok) return r1

      const type = r1.data?.error?.type

      // Si el error es por campo desconocido o valor inválido, probamos variantes
      const variants = []

      // ✅ Outcome vs Activity Type (tu tabla usa Outcome)
      if (Object.prototype.hasOwnProperty.call(fields, "Outcome")) {
        const base = { ...fields }
        const val = base.Outcome
        delete base.Outcome
        variants.push({ ...base, "Activity Type": val })
      }
      if (Object.prototype.hasOwnProperty.call(fields, "Activity Type")) {
        const base = { ...fields }
        const val = base["Activity Type"]
        delete base["Activity Type"]
        variants.push({ ...base, Outcome: val })
      }

      // ✅ Activity Date: si mandaron datetime y era date-only, forzamos YYYY-MM-DD
      if (Object.prototype.hasOwnProperty.call(fields, "Activity Date")) {
        const base = { ...fields }
        base["Activity Date"] = normalizeDate(base["Activity Date"])
        variants.push(base)
      }

      // ✅ Notes variantes (por si)
      if (Object.prototype.hasOwnProperty.call(fields, "Notes")) {
        const base = { ...fields }
        const val = base.Notes
        delete base.Notes
        variants.push({ ...base, "Notas": val })
        variants.push({ ...base, "Observaciones": val })
      }

      // ✅ Owner Email variantes (por si)
      if (Object.prototype.hasOwnProperty.call(fields, "Owner Email")) {
        const base = { ...fields }
        const val = base["Owner Email"]
        delete base["Owner Email"]
        variants.push({ ...base, "Responsible Email": val })
        variants.push({ ...base, "Responsible": val })
      }

      // Si el error original no era de campos/valores, igual probamos 1 ronda
      if (type === "UNKNOWN_FIELD_NAME" || type === "INVALID_VALUE_FOR_COLUMN") {
        for (const v of variants) {
          const rx = await attempt(v)
          if (rx.ok) return rx
        }
      } else {
        // probamos igual 1 fallback clave Outcome <-> Activity Type
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

      const normalized = email.trim().toLowerCase()

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
       ME (NO AUTH REQUIRED)
    ====================================================== */

    if (action === "me") {
      const email = getSessionEmail()
      if (!email) return res.status(401).json({ authenticated: false })
      return res.status(200).json({ authenticated: true, email })
    }

    /* =====================================================
       AUTH REQUIRED BELOW
    ====================================================== */

    const email = requireAuth()
    if (!email) return

    /* =====================================================
       GET COMPANIES
    ====================================================== */

    if (action === "getCompanies") {
      try {
        const formula = `{Responsible Email}="${email}"`
        const records = await fetchAllAirtableRecords("Companies", {
          filterByFormula: formula
        })
        return res.status(200).json({ records })
      } catch (e) {
        return res
          .status(e.status || 500)
          .json({
            error: "Failed to fetch companies",
            details: e.details || String(e.message || e)
          })
      }
    }

    /* =====================================================
       GET COMPANY
    ====================================================== */

    if (action === "getCompany") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing company ID" })

      const r = await fetch(`https://api.airtable.com/v0/${baseId}/Companies/${id}`, {
        headers: AIRTABLE_HEADERS
      })
      const data = await readJson(r)

      if (!r.ok) {
        return res.status(r.status).json({ error: "Company not found", details: data })
      }

      if (forbidIfNotOwner(data, email)) {
        return res.status(403).json({ error: "Forbidden" })
      }

      return res.status(200).json(data)
    }

    /* =====================================================
       UPDATE COMPANY
    ====================================================== */

    if (action === "updateCompany") {
      const { id, fields } = body
      if (!id || !fields) return res.status(400).json({ error: "Missing data" })

      const check = await fetch(`https://api.airtable.com/v0/${baseId}/Companies/${id}`, {
        headers: AIRTABLE_HEADERS
      })
      const existing = await readJson(check)
      if (!check.ok) {
        return res.status(check.status).json({ error: "Company not found", details: existing })
      }
      if (forbidIfNotOwner(existing, email)) {
        return res.status(403).json({ error: "Forbidden" })
      }

      const r = await fetch(`https://api.airtable.com/v0/${baseId}/Companies/${id}`, {
        method: "PATCH",
        headers: AIRTABLE_HEADERS,
        body: JSON.stringify({ fields })
      })
      const data = await readJson(r)

      if (!r.ok) {
        return res.status(r.status).json({ error: "Failed to update company", details: data })
      }

      return res.status(200).json(data)
    }

    /* =====================================================
       GET CONTACTS (ENRICHED)
    ====================================================== */

    if (action === "getContacts") {
      try {
        const formula = `{Responsible Email}="${email}"`
        const contacts = await fetchAllAirtableRecords("Contacts", {
          filterByFormula: formula
        })

        let companies = []
        try {
          companies = await fetchAllAirtableRecords("Companies")
        } catch {
          companies = []
        }

        const companiesMap = {}
        companies.forEach((c) => {
          companiesMap[c.id] = c.fields || {}
        })

        const enrichedContacts = contacts.map((contact) => {
          const companyId = contact.fields?.Company?.[0]
          const companyData = companyId ? companiesMap[companyId] : null

          return {
            ...contact,
            fields: {
              ...contact.fields,
              CompanyWebsite: companyData?.Website || ""
            }
          }
        })

        return res.status(200).json({ records: enrichedContacts })
      } catch (e) {
        return res
          .status(e.status || 500)
          .json({
            error: "Failed to fetch contacts",
            details: e.details || String(e.message || e)
          })
      }
    }

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

      if (!r.ok) {
        return res.status(r.status).json({ error: "Contact not found", details: data })
      }

      if (forbidIfNotOwner(data, email)) {
        return res.status(403).json({ error: "Forbidden" })
      }

      return res.status(200).json(data)
    }

    /* =====================================================
       UPDATE CONTACT ✅
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
      if (forbidIfNotOwner(existing, email)) {
        return res.status(403).json({ error: "Forbidden" })
      }

      const safePatchFields = buildSafeContactPatchFields(existing.fields || {}, fields)

      if (!Object.keys(safePatchFields).length) {
        return res.status(200).json(existing)
      }

      const r = await fetch(`https://api.airtable.com/v0/${baseId}/Contacts/${id}`, {
        method: "PATCH",
        headers: AIRTABLE_HEADERS,
        body: JSON.stringify({ fields: safePatchFields })
      })
      const data = await readJson(r)

      if (!r.ok) {
        return res.status(r.status).json({ error: "Failed to update contact", details: data })
      }

      return res.status(200).json(data)
    }

    /* =====================================================
       CREATE ACTIVITY ✅✅ ARREGLADO PARA TU BASE
       - Escribe en Outcome (como tu tabla)
       - Activity Date como YYYY-MM-DD (date-only)
       - Next Follow-up Date ok
    ====================================================== */

    if (action === "createActivity") {
      const { contactId, type, notes, nextFollowUp } = body

      if (!contactId || !type) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      // validar ownership + company recXXX
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

      if (contactData.fields?.["Responsible Email"] !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      const rawCompany = contactData.fields?.Company
      const candidate =
        Array.isArray(rawCompany) && rawCompany.length > 0 ? rawCompany[0] : null

      const linkedCompanyId =
        typeof candidate === "string" && candidate.startsWith("rec") ? candidate : null

      // ✅ IMPORTANTE: Activity Date date-only
      const activityDate = normalizeDate(new Date())

      const fieldsToSend = {
        // ✅ Tu tabla usa Outcome (según captura)
        Outcome: String(type),
        "Related Contact": [contactId],
        "Activity Date": activityDate,
        "Owner Email": email,
        Notes: String(notes || "")
      }

      const nfu = normalizeDate(nextFollowUp)
      if (nfu) fieldsToSend["Next Follow-up Date"] = nfu

      if (linkedCompanyId) {
        fieldsToSend["Related Company"] = [linkedCompanyId]
      }

      // ✅ create robusto con fallbacks (Outcome <-> Activity Type, fechas, etc)
      const r = await createWithFallbacks("Activities", fieldsToSend)

      if (!r.ok) {
        return res.status(r.status).json({
          error: "Failed to create activity",
          details: r.data
        })
      }

      return res.status(200).json(r.data)
    }

    /* =====================================================
       GET ACTIVITIES
    ====================================================== */

if (action === "getActivities") {
  const { contactId } = req.query
  if (!contactId) return res.status(400).json({ error: "Missing contact ID" })

  try {
    // 1) intento original (por recordId) — a veces no matchea por como Airtable evalúa linked fields
    const formulaById = `AND(FIND("${contactId}", ARRAYJOIN({Related Contact})), {Owner Email}="${email}")`
    let records = await fetchAllAirtableRecords("Activities", {
      filterByFormula: formulaById
    })

    // 2) fallback: buscar nombre/email del contacto y filtrar por lookup/texto
    if (!records.length) {
      const cRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/Contacts/${contactId}`,
        { headers: AIRTABLE_HEADERS }
      )
      const cData = await readJson(cRes)

      if (cRes.ok) {
        const fullName =
          cData?.fields?.["Full Name"] ||
          cData?.fields?.Name ||
          cData?.fields?.["Contact Name"] ||
          ""

        const contactEmail = cData?.fields?.Email || ""

        const esc = (s) => String(s || "").replace(/"/g, '\\"')

        const parts = []
        if (fullName) {
          // Contact Name suele ser lookup, por eso ARRAYJOIN
          parts.push(`FIND("${esc(fullName)}", ARRAYJOIN({Contact Name}))`)
          parts.push(`FIND("${esc(fullName)}", ARRAYJOIN({Related Contact}))`)
        }
        if (contactEmail) {
          parts.push(`FIND("${esc(contactEmail)}", ARRAYJOIN({Contact Name}))`)
          parts.push(`FIND("${esc(contactEmail)}", ARRAYJOIN({Related Contact}))`)
        }

        const formulaByNameOrEmail =
          parts.length
            ? `AND({Owner Email}="${email}", OR(${parts.join(",")}))`
            : `{Owner Email}="${email}"`

        records = await fetchAllAirtableRecords("Activities", {
          filterByFormula: formulaByNameOrEmail
        })
      }
    }

    // orden por fecha (date-only) + fallback createdTime
    records.sort((a, b) => {
      const ad = a?.fields?.["Activity Date"]
        ? new Date(a.fields["Activity Date"])
        : new Date(a?.createdTime || 0)

      const bd = b?.fields?.["Activity Date"]
        ? new Date(b.fields["Activity Date"])
        : new Date(b?.createdTime || 0)

      return bd - ad
    })

    return res.status(200).json({ records })
  } catch (e) {
    return res
      .status(e.status || 500)
      .json({ error: "Failed to fetch activities", details: e.details || String(e.message || e) })
  }
}


    /* =====================================================
       GET CALENDAR
    ====================================================== */

    if (action === "getCalendar") {
      try {
        const formula = `{Owner Email}="${email}"`
        const records = await fetchAllAirtableRecords("Activities", {
          filterByFormula: formula
        })
        return res.status(200).json({ records })
      } catch (e) {
        return res
          .status(e.status || 500)
          .json({
            error: "Failed to fetch calendar",
            details: e.details || String(e.message || e)
          })
      }
    }

    /* =====================================================
       DASHBOARD STATS (tu lógica)
    ====================================================== */

    if (action === "getDashboardStats") {
      try {
        const contacts = await fetchAllAirtableRecords("Contacts", {
          filterByFormula: `{Responsible Email}="${email}"`
        })

        const totalLeads = contacts.length

        const activeLeads = contacts.filter((c) => c.fields?.Status !== "Closed Lost").length
        const meetingsBooked = contacts.filter((c) => c.fields?.Status === "Meeting Booked").length
        const closedWon = contacts.filter((c) => c.fields?.Status === "Closed Won").length

        const conversionRate =
          totalLeads > 0 ? ((closedWon / totalLeads) * 100).toFixed(1) : 0

        const winRate =
          meetingsBooked > 0 ? ((closedWon / meetingsBooked) * 100).toFixed(1) : 0

        let atRiskLeads = 0
        let coolingLeads = 0
        let leadsWithoutFollowUp = 0
        let totalDaysWithoutContact = 0
        let countedLeads = 0

        const now = new Date()

        contacts.forEach((contact) => {
          const lastActivity = contact.fields?.["Last Activity Date"]
          const nextFollowUp = contact.fields?.["Next Follow-up Date"]

          if (!nextFollowUp) {
            leadsWithoutFollowUp++
          }

          if (lastActivity) {
            const diffTime = Math.abs(now - new Date(lastActivity))
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

            totalDaysWithoutContact += diffDays
            countedLeads++

            if (diffDays >= 7) atRiskLeads++
            else if (diffDays >= 5) coolingLeads++
          }
        })

        const avgDaysWithoutContact =
          countedLeads > 0 ? (totalDaysWithoutContact / countedLeads).toFixed(1) : 0

        return res.status(200).json({
          totalLeads,
          activeLeads,
          meetingsBooked,
          closedWon,
          conversionRate,
          winRate,
          atRiskLeads,
          coolingLeads,
          leadsWithoutFollowUp,
          avgDaysWithoutContact
        })
      } catch (e) {
        return res.status(500).json({
          error: "Failed to load dashboard stats",
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
