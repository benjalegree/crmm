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

    // Evita caches raros en deploy
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

    // PATCH robusto: intenta con variantes si el campo no existe
    const patchWithFieldFallbacks = async (table, id, fields) => {
      const attempt = async (payloadFields) => {
        const r = await fetch(
          `https://api.airtable.com/v0/${baseId}/${table}/${id}`,
          {
            method: "PATCH",
            headers: AIRTABLE_HEADERS,
            body: JSON.stringify({ fields: payloadFields })
          }
        )
        const data = await readJson(r)
        return { ok: r.ok, status: r.status, data }
      }

      // 1) intento directo
      let r1 = await attempt(fields)
      if (r1.ok) return r1

      // 2) si error de campo desconocido, probamos variantes comunes
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
        variants.push({ ...base, "Permanent Notes": val })
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

      // Next Follow-up Date variants
      if (Object.prototype.hasOwnProperty.call(fields, "Next Follow-up Date")) {
        const base = { ...fields }
        const val = base["Next Follow-up Date"]
        delete base["Next Follow-up Date"]
        variants.push({ ...base, "Next Follow Up Date": val })
        variants.push({ ...base, "Próximo seguimiento": val })
        variants.push({ ...base, "Proximo seguimiento": val })
      }

      // LinkedIn variants
      if (Object.prototype.hasOwnProperty.call(fields, "LinkedIn URL")) {
        const base = { ...fields }
        const val = base["LinkedIn URL"]
        delete base["LinkedIn URL"]
        variants.push({ ...base, LinkedIn: val })
        variants.push({ ...base, Linkedin: val })
      }

      for (const v of variants) {
        const rx = await attempt(v)
        if (rx.ok) return rx
      }

      // si nada funcionó, devolvemos el primero para debug real
      return r1
    }

    const forbidIfNotOwner = (record, email) => {
      if (!record?.fields) return false
      return record.fields["Responsible Email"] !== email
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
          .json({ error: "Failed to fetch companies", details: e.details || String(e.message || e) })
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

      // check ownership
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

        // opcional: map de companies para extra (no rompe si falla)
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
          .json({ error: "Failed to fetch contacts", details: e.details || String(e.message || e) })
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
       UPDATE CONTACT  ✅ robusto con fallbacks
    ====================================================== */

    if (action === "updateContact") {
      const { id, fields } = body
      if (!id || !fields) return res.status(400).json({ error: "Missing data" })

      // check ownership
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

      // normalizamos fecha si viene
      const safeFields = { ...fields }
      if (Object.prototype.hasOwnProperty.call(safeFields, "Next Follow-up Date")) {
        safeFields["Next Follow-up Date"] = normalizeDate(safeFields["Next Follow-up Date"])
      }

      const r = await patchWithFieldFallbacks("Contacts", id, safeFields)

      if (!r.ok) {
        return res.status(r.status).json({ error: "Failed to update contact", details: r.data })
      }

      return res.status(200).json(r.data)
    }

    /* =====================================================
       CREATE ACTIVITY ✅ robusto, fechas, no rompe con lookups
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

      const fieldsToSend = {
        "Activity Type": type,
        "Related Contact": [contactId],
        "Activity Date": new Date().toISOString(),
        "Owner Email": email,
        "Notes": String(notes || ""),
        "Next Follow-up Date": normalizeDate(nextFollowUp)
      }

      if (linkedCompanyId) {
        fieldsToSend["Related Company"] = [linkedCompanyId]
      }

      const r = await fetch(`https://api.airtable.com/v0/${baseId}/Activities`, {
        method: "POST",
        headers: AIRTABLE_HEADERS,
        body: JSON.stringify({ fields: fieldsToSend })
      })

      const data = await readJson(r)

      if (!r.ok) {
        return res.status(r.status).json({
          error: "Failed to create activity",
          details: data
        })
      }

      return res.status(200).json(data)
    }

    /* =====================================================
       GET ACTIVITIES (paginado)
    ====================================================== */

    if (action === "getActivities") {
      const { contactId } = req.query
      if (!contactId) return res.status(400).json({ error: "Missing contact ID" })

      try {
        const formula = `AND(FIND("${contactId}", ARRAYJOIN({Related Contact})), {Owner Email}="${email}")`
        const records = await fetchAllAirtableRecords("Activities", {
          filterByFormula: formula
        })

        records.sort(
          (a, b) =>
            new Date(b.fields?.["Activity Date"] || 0) -
            new Date(a.fields?.["Activity Date"] || 0)
        )

        return res.status(200).json({ records })
      } catch (e) {
        return res
          .status(e.status || 500)
          .json({ error: "Failed to fetch activities", details: e.details || String(e.message || e) })
      }
    }

    /* =====================================================
       GET CALENDAR (para la vista Calendar)
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
          .json({ error: "Failed to fetch calendar", details: e.details || String(e.message || e) })
      }
    }

    /* =====================================================
       DASHBOARD STATS (mantiene tu lógica)
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
