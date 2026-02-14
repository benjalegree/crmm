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

    /* =====================================================
       SESSION HELPERS
    ====================================================== */

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

    const safeJson = async (resp) => {
      try {
        return await resp.json()
      } catch {
        return {}
      }
    }

    const airtableGet = async (url) => {
      return fetch(url, { headers: AIRTABLE_HEADERS })
    }

    const airtablePatch = async (url, payload) => {
      return fetch(url, {
        method: "PATCH",
        headers: AIRTABLE_HEADERS,
        body: JSON.stringify(payload)
      })
    }

    const airtablePost = async (url, payload) => {
      return fetch(url, {
        method: "POST",
        headers: AIRTABLE_HEADERS,
        body: JSON.stringify(payload)
      })
    }

    /* =====================================================
       LOGIN
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
       ME
    ====================================================== */

    if (action === "me") {
      const email = getSessionEmail()

      if (!email) {
        return res.status(401).json({ authenticated: false })
      }

      return res.status(200).json({
        authenticated: true,
        email
      })
    }

    const email = requireAuth()
    if (!email) return

    /* =====================================================
       GET COMPANIES
    ====================================================== */

    if (action === "getCompanies") {
      const formula = `{Responsible Email}="${email}"`

      const response = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Companies?filterByFormula=${encodeURIComponent(
          formula
        )}`
      )

      if (!response.ok) {
        const err = await safeJson(response)
        return res
          .status(response.status)
          .json({ error: "Failed to fetch companies", details: err })
      }

      const data = await safeJson(response)
      return res.status(200).json(data)
    }

    /* =====================================================
       GET COMPANY
    ====================================================== */

    if (action === "getCompany") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing company ID" })

      const response = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Companies/${id}`
      )

      if (!response.ok) {
        const err = await safeJson(response)
        return res
          .status(response.status)
          .json({ error: "Company not found", details: err })
      }

      const data = await safeJson(response)

      if (data.fields?.["Responsible Email"] !== email) {
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

      const check = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Companies/${id}`
      )

      if (!check.ok) {
        const err = await safeJson(check)
        return res
          .status(check.status)
          .json({ error: "Company not found", details: err })
      }

      const existing = await safeJson(check)
      if (existing.fields?.["Responsible Email"] !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      const response = await airtablePatch(
        `https://api.airtable.com/v0/${baseId}/Companies/${id}`,
        { fields }
      )

      if (!response.ok) {
        const err = await safeJson(response)
        return res
          .status(response.status)
          .json({ error: "Failed to update company", details: err })
      }

      const data = await safeJson(response)
      return res.status(200).json(data)
    }

    /* =====================================================
       GET CONTACTS (con enrich opcional)
    ====================================================== */

    if (action === "getContacts") {
      const formula = `{Responsible Email}="${email}"`

      const contactsRes = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Contacts?filterByFormula=${encodeURIComponent(
          formula
        )}`
      )

      if (!contactsRes.ok) {
        const err = await safeJson(contactsRes)
        return res
          .status(contactsRes.status)
          .json({ error: "Failed to fetch contacts", details: err })
      }

      const contactsData = await safeJson(contactsRes)
      const contacts = contactsData.records || []

      // Enrich: Website de la company (sin romper si no existe)
      const companiesRes = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Companies`
      )
      const companiesData = await safeJson(companiesRes)
      const companies = companiesData.records || []

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
    }

    /* =====================================================
       GET CONTACT
    ====================================================== */

    if (action === "getContact") {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: "Missing contact ID" })

      const response = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Contacts/${id}`
      )

      if (!response.ok) {
        const err = await safeJson(response)
        return res
          .status(response.status)
          .json({ error: "Contact not found", details: err })
      }

      const data = await safeJson(response)

      if (data.fields?.["Responsible Email"] !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      return res.status(200).json(data)
    }

    /* =====================================================
       UPDATE CONTACT
    ====================================================== */

    if (action === "updateContact") {
      const { id, fields } = body
      if (!id || !fields) return res.status(400).json({ error: "Missing data" })

      const check = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Contacts/${id}`
      )

      if (!check.ok) {
        const err = await safeJson(check)
        return res
          .status(check.status)
          .json({ error: "Contact not found", details: err })
      }

      const existing = await safeJson(check)
      if (existing.fields?.["Responsible Email"] !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      const response = await airtablePatch(
        `https://api.airtable.com/v0/${baseId}/Contacts/${id}`,
        { fields }
      )

      if (!response.ok) {
        const err = await safeJson(response)
        return res
          .status(response.status)
          .json({ error: "Failed to update contact", details: err })
      }

      const data = await safeJson(response)
      return res.status(200).json(data)
    }

    /* =====================================================
       CREATE ACTIVITY ✅ FIX REAL
       - NO manda Next Follow-up Date a Activities
       - Guarda follow-up y last activity en CONTACT
       - Actualiza Status automático según tipo
    ====================================================== */

    if (action === "createActivity") {
      const { contactId, type, notes, nextFollowUp } = body

      if (!contactId || !type) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      // 1) Traer contact y validar ownership
      const contactRes = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Contacts/${contactId}`
      )
      const contactData = await safeJson(contactRes)

      if (!contactRes.ok) {
        return res.status(contactRes.status).json({
          error: "Failed to fetch contact for activity",
          details: contactData
        })
      }

      if (contactData.fields?.["Responsible Email"] !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      // 2) Detectar company link real recXXX (si existe)
      const rawCompany = contactData.fields?.Company
      const candidate =
        Array.isArray(rawCompany) && rawCompany.length > 0 ? rawCompany[0] : null
      const linkedCompanyId =
        typeof candidate === "string" && candidate.startsWith("rec")
          ? candidate
          : null

      // 3) Crear Activity
      const fieldsToSend = {
        "Activity Type": type,
        "Related Contact": [contactId],
        "Activity Date": new Date().toISOString(),
        "Owner Email": email,
        "Notes": notes || ""
      }

      if (linkedCompanyId) {
        fieldsToSend["Related Company"] = [linkedCompanyId]
      }

      const activityRes = await airtablePost(
        `https://api.airtable.com/v0/${baseId}/Activities`,
        { fields: fieldsToSend }
      )

      const activityData = await safeJson(activityRes)

      if (!activityRes.ok) {
        return res.status(activityRes.status).json({
          error: "Failed to create activity",
          details: activityData
        })
      }

      // 4) Patch contacto: Last Activity Date + Next Follow-up Date + Status auto
      // (esto hace que dashboard y calendar funcionen bien)
      const nowISO = new Date().toISOString()

      const currentStatus = contactData.fields?.Status || ""
      let nextStatus = currentStatus

      // Auto status (opcional, pero útil)
      if (!currentStatus || currentStatus === "Not Contacted") {
        if (type === "Call" || type === "Email" || type === "LinkedIn") {
          nextStatus = "Contacted"
        }
      }
      if (type === "Meeting") nextStatus = "Meeting Booked"

      const contactPatchFields = {
        "Last Activity Date": nowISO
      }

      if (nextFollowUp) {
        contactPatchFields["Next Follow-up Date"] = nextFollowUp
      }

      if (nextStatus && nextStatus !== currentStatus) {
        contactPatchFields["Status"] = nextStatus
      }

      // Solo patch si hay algo
      await airtablePatch(
        `https://api.airtable.com/v0/${baseId}/Contacts/${contactId}`,
        { fields: contactPatchFields }
      )

      return res.status(200).json({
        success: true,
        activity: activityData,
        contactUpdated: contactPatchFields
      })
    }

    /* =====================================================
       GET ACTIVITIES (rápido y correcto)
    ====================================================== */

    if (action === "getActivities") {
      const { contactId } = req.query
      if (!contactId) return res.status(400).json({ error: "Missing contact ID" })

      // Seguridad: validar que el contacto es tuyo
      const contactRes = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Contacts/${contactId}`
      )
      const contactData = await safeJson(contactRes)

      if (!contactRes.ok) {
        return res.status(contactRes.status).json({
          error: "Failed to fetch contact for activities",
          details: contactData
        })
      }

      if (contactData.fields?.["Responsible Email"] !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      const formula = `AND({Owner Email}="${email}", FIND("${contactId}", ARRAYJOIN({Related Contact})))`

      const response = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Activities?filterByFormula=${encodeURIComponent(
          formula
        )}`
      )

      if (!response.ok) {
        const err = await safeJson(response)
        return res
          .status(response.status)
          .json({ error: "Failed to fetch activities", details: err })
      }

      const data = await safeJson(response)

      const records = (data.records || []).sort(
        (a, b) =>
          new Date(b.fields?.["Activity Date"] || 0) -
          new Date(a.fields?.["Activity Date"] || 0)
      )

      return res.status(200).json({ records })
    }

    /* =====================================================
       DASHBOARD STATS
    ====================================================== */

    if (action === "getDashboardStats") {
      const contactsRes = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Contacts?filterByFormula=${encodeURIComponent(
          `{Responsible Email}="${email}"`
        )}`
      )

      if (!contactsRes.ok) {
        const err = await safeJson(contactsRes)
        return res.status(500).json({ error: "Failed to load contacts", details: err })
      }

      const contactsData = await safeJson(contactsRes)
      const contacts = contactsData.records || []

      const totalLeads = contacts.length
      const activeLeads = contacts.filter((c) => c.fields?.Status !== "Closed Lost").length
      const meetingsBooked = contacts.filter((c) => c.fields?.Status === "Meeting Booked").length
      const closedWon = contacts.filter((c) => c.fields?.Status === "Closed Won").length

      const conversionRate = totalLeads > 0 ? ((closedWon / totalLeads) * 100).toFixed(1) : 0
      const winRate = meetingsBooked > 0 ? ((closedWon / meetingsBooked) * 100).toFixed(1) : 0

      let atRiskLeads = 0
      let coolingLeads = 0
      let leadsWithoutFollowUp = 0
      let totalDaysWithoutContact = 0
      let countedLeads = 0

      const now = new Date()

      contacts.forEach((contact) => {
        const lastActivity = contact.fields?.["Last Activity Date"]
        const nextFollowUp = contact.fields?.["Next Follow-up Date"]

        if (!nextFollowUp) leadsWithoutFollowUp++

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
