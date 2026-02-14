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

      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/Companies?filterByFormula=${encodeURIComponent(formula)}`,
        { headers: AIRTABLE_HEADERS }
      )

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch companies" })
      }

      const data = await response.json()
      return res.status(200).json(data)
    }

    /* =====================================================
       GET COMPANY
    ====================================================== */

    if (action === "getCompany") {
      const { id } = req.query

      if (!id) return res.status(400).json({ error: "Missing company ID" })

      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/Companies/${id}`,
        { headers: AIRTABLE_HEADERS }
      )

      if (!response.ok) {
        return res.status(response.status).json({ error: "Company not found" })
      }

      const data = await response.json()

      if (data.fields["Responsible Email"] !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      return res.status(200).json(data)
    }

    /* =====================================================
       UPDATE COMPANY
    ====================================================== */

    if (action === "updateCompany") {
      const { id, fields } = body

      if (!id || !fields) {
        return res.status(400).json({ error: "Missing data" })
      }

      const check = await fetch(
        `https://api.airtable.com/v0/${baseId}/Companies/${id}`,
        { headers: AIRTABLE_HEADERS }
      )

      if (!check.ok) {
        return res.status(check.status).json({ error: "Company not found" })
      }

      const existing = await check.json()

      if (existing.fields["Responsible Email"] !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/Companies/${id}`,
        {
          method: "PATCH",
          headers: AIRTABLE_HEADERS,
          body: JSON.stringify({ fields })
        }
      )

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to update company" })
      }

      const data = await response.json()
      return res.status(200).json(data)
    }

    /* =====================================================
       GET CONTACTS
    ====================================================== */

    if (action === "getContacts") {
      const formula = `{Responsible Email}="${email}"`

      const contactsRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/Contacts?filterByFormula=${encodeURIComponent(formula)}`,
        { headers: AIRTABLE_HEADERS }
      )

      if (!contactsRes.ok) {
        return res.status(contactsRes.status).json({ error: "Failed to fetch contacts" })
      }

      const contactsData = await contactsRes.json()
      const contacts = contactsData.records || []

      const companiesRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/Companies`,
        { headers: AIRTABLE_HEADERS }
      )

      const companiesData = await companiesRes.json()
      const companies = companiesData.records || []

      const companiesMap = {}
      companies.forEach(c => {
        companiesMap[c.id] = c.fields
      })

      const enrichedContacts = contacts.map(contact => {
        const companyId = contact.fields.Company?.[0]
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

      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/Contacts/${id}`,
        { headers: AIRTABLE_HEADERS }
      )

      if (!response.ok) {
        return res.status(response.status).json({ error: "Contact not found" })
      }

      const data = await response.json()

      if (data.fields["Responsible Email"] !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      return res.status(200).json(data)
    }

    /* =====================================================
       UPDATE CONTACT
    ====================================================== */

    if (action === "updateContact") {
      const { id, fields } = body

      if (!id || !fields) {
        return res.status(400).json({ error: "Missing data" })
      }

      const check = await fetch(
        `https://api.airtable.com/v0/${baseId}/Contacts/${id}`,
        { headers: AIRTABLE_HEADERS }
      )

      if (!check.ok) {
        return res.status(check.status).json({ error: "Contact not found" })
      }

      const existing = await check.json()

      if (existing.fields["Responsible Email"] !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/Contacts/${id}`,
        {
          method: "PATCH",
          headers: AIRTABLE_HEADERS,
          body: JSON.stringify({ fields })
        }
      )

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to update contact" })
      }

      const data = await response.json()
      return res.status(200).json(data)
    }

    /* =====================================================
       CREATE ACTIVITY  ✅ FIX ROBUSTO (NO DEPENDE DE COMPANY ID)
       - Si Company es lookup (nombre) NO rompe.
       - Si Company es link (recordId recxxx) lo usa.
       - Siempre crea la actividad.
    ====================================================== */

    if (action === "createActivity") {
      const { contactId, type, notes, nextFollowUp } = body

      if (!contactId || !type) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      // 1) Obtener contacto para asegurar ownership y (si existe) company recordId real
      const contactRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/Contacts/${contactId}`,
        { headers: AIRTABLE_HEADERS }
      )

      const contactData = await contactRes.json()

      if (!contactRes.ok) {
        console.error("CONTACT FETCH ERROR:", contactData)
        return res.status(contactRes.status).json(contactData)
      }

      if (contactData.fields["Responsible Email"] !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      // 2) Company puede ser:
      // - Link -> ["recXXXX"]
      // - Lookup -> ["Nombre empresa"] o string
      // Solo usamos companyId si es recordId válido
      const rawCompany = contactData.fields.Company
      const candidate =
        Array.isArray(rawCompany) && rawCompany.length > 0
          ? rawCompany[0]
          : null

      const linkedCompanyId =
        typeof candidate === "string" && candidate.startsWith("rec")
          ? candidate
          : null

      // 3) Crear fields SIN mandar Related Company si no es recXXX
      const fieldsToSend = {
        "Activity Type": type,
        "Related Contact": [contactId],
        "Activity Date": new Date().toISOString(),
        "Owner Email": email,
        "Notes": notes || "",
        "Next Follow-up Date": nextFollowUp || null
      }

      if (linkedCompanyId) {
        fieldsToSend["Related Company"] = [linkedCompanyId]
      } else {
        // NO enviamos Related Company para que Airtable no rechace por formato inválido
        fieldsToSend["Related Company"] = []
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/Activities`,
        {
          method: "POST",
          headers: AIRTABLE_HEADERS,
          body: JSON.stringify({ fields: fieldsToSend })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error("ACTIVITY CREATE ERROR:", data)
        return res.status(response.status).json(data)
      }

      return res.status(200).json(data)
    }

    /* =====================================================
       GET ACTIVITIES ✅ FIX ROBUSTO
       - En vez de depender de una formula frágil con ARRAYJOIN/FIND,
         traemos por Owner Email y filtramos en server por contactId.
       - Así SIEMPRE aparecen las nuevas.
    ====================================================== */

    if (action === "getActivities") {
      const { contactId } = req.query

      if (!contactId) {
        return res.status(400).json({ error: "Missing contact ID" })
      }

      // Traemos todas las actividades del owner (filtro estable)
      const formula = `{Owner Email}="${email}"`

      const response = await fetch(
        `https://api.airtable.com/v0/${baseId}/Activities?filterByFormula=${encodeURIComponent(formula)}`,
        { headers: AIRTABLE_HEADERS }
      )

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        console.error("GET ACTIVITIES FETCH ERROR:", errData)
        return res.status(response.status).json({ error: "Failed to fetch activities", details: errData })
      }

      const data = await response.json()

      // Filtramos por contacto de forma segura
      const filtered = (data.records || []).filter(r => {
        const rel = r.fields?.["Related Contact"]
        return Array.isArray(rel) && rel.includes(contactId)
      })

      const records = filtered.sort(
        (a, b) =>
          new Date(b.fields["Activity Date"]) -
          new Date(a.fields["Activity Date"])
      )

      return res.status(200).json({ records })
    }

    /* =====================================================
       DASHBOARD INTELIGENTE SaaS B2B
    ====================================================== */

    if (action === "getDashboardStats") {
      const contactsRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/Contacts?filterByFormula=${encodeURIComponent(
          `{Responsible Email}="${email}"`
        )}`,
        { headers: AIRTABLE_HEADERS }
      )

      if (!contactsRes.ok) {
        return res.status(500).json({ error: "Failed to load contacts" })
      }

      const contactsData = await contactsRes.json()
      const contacts = contactsData.records || []

      const totalLeads = contacts.length

      const activeLeads = contacts.filter(c =>
        c.fields.Status !== "Closed Lost"
      ).length

      const meetingsBooked = contacts.filter(c =>
        c.fields.Status === "Meeting Booked"
      ).length

      const closedWon = contacts.filter(c =>
        c.fields.Status === "Closed Won"
      ).length

      const conversionRate =
        totalLeads > 0
          ? ((closedWon / totalLeads) * 100).toFixed(1)
          : 0

      const winRate =
        meetingsBooked > 0
          ? ((closedWon / meetingsBooked) * 100).toFixed(1)
          : 0

      let atRiskLeads = 0
      let coolingLeads = 0
      let leadsWithoutFollowUp = 0
      let totalDaysWithoutContact = 0
      let countedLeads = 0

      const now = new Date()

      contacts.forEach(contact => {
        const lastActivity = contact.fields["Last Activity Date"]
        const nextFollowUp = contact.fields["Next Follow-up Date"]

        if (!nextFollowUp) {
          leadsWithoutFollowUp++
        }

        if (lastActivity) {
          const diffTime = Math.abs(now - new Date(lastActivity))
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

          totalDaysWithoutContact += diffDays
          countedLeads++

          if (diffDays >= 7) {
            atRiskLeads++
          } else if (diffDays >= 5) {
            coolingLeads++
          }
        }
      })

      const avgDaysWithoutContact =
        countedLeads > 0
          ? (totalDaysWithoutContact / countedLeads).toFixed(1)
          : 0

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
    return res.status(500).json({ error: "Internal server error" })
  }
}
