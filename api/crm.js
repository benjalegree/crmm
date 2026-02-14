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

    const safeJson = async (resp) => {
      try {
        return await resp.json()
      } catch {
        return {}
      }
    }

    const airtableGet = (url) => fetch(url, { headers: AIRTABLE_HEADERS })

    const airtablePatch = (url, payload) =>
      fetch(url, {
        method: "PATCH",
        headers: AIRTABLE_HEADERS,
        body: JSON.stringify(payload)
      })

    const airtablePost = (url, payload) =>
      fetch(url, {
        method: "POST",
        headers: AIRTABLE_HEADERS,
        body: JSON.stringify(payload)
      })

    const pickDefined = (obj) => {
      const out = {}
      Object.keys(obj || {}).forEach((k) => {
        if (obj[k] !== undefined) out[k] = obj[k]
      })
      return out
    }

    /* =====================================================
       SESSION HELPERS
    ====================================================== */

    const getSessionEmail = () => {
      const cookie = req.headers.cookie
      if (!cookie) return null
      if (!cookie.includes("session=")) return null
      return cookie.split("session=")[1]?.split(";")[0]?.trim()?.toLowerCase()
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
      if (!email) return res.status(401).json({ authenticated: false })
      return res.status(200).json({ authenticated: true, email })
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

      const data = await safeJson(response)
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: "Failed to fetch companies", details: data })
      }

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

      const data = await safeJson(response)
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: "Company not found", details: data })
      }

      if ((data.fields?.["Responsible Email"] || "").toLowerCase() !== email) {
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
      const check = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Companies/${id}`
      )
      const existing = await safeJson(check)
      if (!check.ok) {
        return res
          .status(check.status)
          .json({ error: "Company not found", details: existing })
      }

      if ((existing.fields?.["Responsible Email"] || "").toLowerCase() !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      const response = await airtablePatch(
        `https://api.airtable.com/v0/${baseId}/Companies/${id}`,
        { fields: pickDefined(fields) }
      )

      const data = await safeJson(response)
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: "Failed to update company", details: data })
      }

      return res.status(200).json(data)
    }

    /* =====================================================
       GET CONTACTS
    ====================================================== */

    if (action === "getContacts") {
      const formula = `{Responsible Email}="${email}"`

      const contactsRes = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Contacts?filterByFormula=${encodeURIComponent(
          formula
        )}`
      )

      const contactsData = await safeJson(contactsRes)
      if (!contactsRes.ok) {
        return res
          .status(contactsRes.status)
          .json({ error: "Failed to fetch contacts", details: contactsData })
      }

      const contacts = contactsData.records || []

      // Enrich opcional
      const companiesRes = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Companies`
      )
      const companiesData = await safeJson(companiesRes)
      const companies = companiesData.records || []

      const companiesMap = {}
      companies.forEach((c) => (companiesMap[c.id] = c.fields || {}))

      const enriched = contacts.map((contact) => {
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

      return res.status(200).json({ records: enriched })
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

      const data = await safeJson(response)
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: "Contact not found", details: data })
      }

      if ((data.fields?.["Responsible Email"] || "").toLowerCase() !== email) {
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
      const existing = await safeJson(check)
      if (!check.ok) {
        return res
          .status(check.status)
          .json({ error: "Contact not found", details: existing })
      }

      if ((existing.fields?.["Responsible Email"] || "").toLowerCase() !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      const response = await airtablePatch(
        `https://api.airtable.com/v0/${baseId}/Contacts/${id}`,
        { fields: pickDefined(fields) }
      )

      const data = await safeJson(response)
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: "Failed to update contact", details: data })
      }

      return res.status(200).json(data)
    }

    /* =====================================================
       CREATE ACTIVITY (NO rompe si falla el patch del contacto)
    ====================================================== */

    if (action === "createActivity") {
      const { contactId, type, notes, nextFollowUp } = body

      if (!contactId || !type) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      // 1) Load contact + ownership
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

      if ((contactData.fields?.["Responsible Email"] || "").toLowerCase() !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      // 2) Detect Company link recXXX
      const rawCompany = contactData.fields?.Company
      const candidate =
        Array.isArray(rawCompany) && rawCompany.length > 0 ? rawCompany[0] : null
      const linkedCompanyId =
        typeof candidate === "string" && candidate.startsWith("rec") ? candidate : null

      // 3) Create Activity
      const fieldsToSend = {
        "Activity Type": String(type),
        "Related Contact": [contactId],
        "Activity Date": new Date().toISOString(),
        "Owner Email": email,
        "Notes": typeof notes === "string" ? notes : ""
      }

      if (linkedCompanyId) fieldsToSend["Related Company"] = [linkedCompanyId]

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

      // 4) Patch contact (no bloquear si esto falla)
      const patchFields = {}
      patchFields["Last Activity Date"] = new Date().toISOString()

      if (nextFollowUp) patchFields["Next Follow-up Date"] = nextFollowUp

      // status auto (solo si aplica)
      const currentStatus = contactData.fields?.Status || ""
      let nextStatus = currentStatus

      if (!currentStatus || currentStatus === "Not Contacted") {
        if (type === "Call" || type === "Email" || type === "LinkedIn") {
          nextStatus = "Contacted"
        }
      }
      if (type === "Meeting") nextStatus = "Meeting Booked"
      if (nextStatus && nextStatus !== currentStatus) patchFields["Status"] = nextStatus

      let contactPatchError = null

      try {
        if (Object.keys(patchFields).length > 0) {
          const patchRes = await airtablePatch(
            `https://api.airtable.com/v0/${baseId}/Contacts/${contactId}`,
            { fields: patchFields }
          )
          if (!patchRes.ok) {
            const patchData = await safeJson(patchRes)
            contactPatchError = patchData
          }
        }
      } catch (e) {
        contactPatchError = { message: String(e?.message || e) }
      }

      return res.status(200).json({
        success: true,
        activity: activityData,
        contactUpdated: patchFields,
        contactPatchError
      })
    }

    /* =====================================================
       GET ACTIVITIES (sin “failed” silencioso)
    ====================================================== */

    if (action === "getActivities") {
      const { contactId } = req.query
      if (!contactId) return res.status(400).json({ error: "Missing contact ID" })

      // Validate ownership by contact
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

      const owner = (contactData.fields?.["Responsible Email"] || "").toLowerCase()
      if (!owner) {
        return res.status(400).json({
          error: "Contact missing Responsible Email field",
          details: contactData.fields || {}
        })
      }
      if (owner !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      const formula = `AND({Owner Email}="${email}", FIND("${contactId}", ARRAYJOIN({Related Contact})))`

      const response = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Activities?filterByFormula=${encodeURIComponent(
          formula
        )}`
      )

      const data = await safeJson(response)
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: "Failed to fetch activities", details: data })
      }

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

      const contactsData = await safeJson(contactsRes)
      if (!contactsRes.ok) {
        return res.status(500).json({
          error: "Failed to load contacts",
          details: contactsData
        })
      }

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
