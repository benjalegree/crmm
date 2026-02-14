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

    // quita undefined (Airtable no quiere basura)
    const pickDefined = (obj) => {
      const out = {}
      Object.keys(obj || {}).forEach((k) => {
        if (obj[k] !== undefined) out[k] = obj[k]
      })
      return out
    }

    // arma un patch “tolerante” (intenta alias de nombres de campo)
    const buildAliasedFields = (incoming) => {
      const fields = {}

      // --- básicos (estos suelen existir tal cual)
      if (incoming.Email !== undefined) fields["Email"] = incoming.Email
      if (incoming.Position !== undefined) fields["Position"] = incoming.Position
      if (incoming.Status !== undefined) fields["Status"] = incoming.Status

      // --- LinkedIn (varios nombres comunes)
      if (incoming["LinkedIn URL"] !== undefined) {
        const v = incoming["LinkedIn URL"]
        fields["LinkedIn URL"] = v
        fields["LinkedIn"] = v
        fields["Linkedin"] = v
      }

      // --- Phone / Teléfono
      if (incoming.Phone !== undefined) {
        const v = incoming.Phone
        fields["Phone"] = v
        fields["Numero de telefono"] = v
        fields["Número de teléfono"] = v
        fields["Numero de teléfono"] = v
        fields["Teléfono"] = v
        fields["Telefono"] = v
      }
      if (incoming["Numero de telefono"] !== undefined) {
        const v = incoming["Numero de telefono"]
        fields["Numero de telefono"] = v
        fields["Número de teléfono"] = v
        fields["Phone"] = v
        fields["Teléfono"] = v
      }

      // --- Notes generales del contacto (ACÁ estaba el problema)
      // Airtable en tu base puede llamarse: Notes / Contact Notes / Notas / Observaciones / Permanent Notes
      if (incoming.Notes !== undefined) {
        const v = incoming.Notes
        fields["Notes"] = v
        fields["Contact Notes"] = v
        fields["Notas"] = v
        fields["Observaciones"] = v
        fields["Permanent Notes"] = v
      }
      if (incoming["Contact Notes"] !== undefined) {
        const v = incoming["Contact Notes"]
        fields["Contact Notes"] = v
        fields["Notes"] = v
        fields["Notas"] = v
        fields["Observaciones"] = v
      }

      // --- Next Follow-up del contacto
      if (incoming["Next Follow-up Date"] !== undefined) {
        const v = incoming["Next Follow-up Date"] || null
        fields["Next Follow-up Date"] = v
        fields["Next follow-up Date"] = v
        fields["Next Follow Up Date"] = v
        fields["Próximo seguimiento"] = v
        fields["Proximo seguimiento"] = v
      }

      // --- Last Activity Date (si te lo mandan o lo usamos interno)
      if (incoming["Last Activity Date"] !== undefined) {
        const v = incoming["Last Activity Date"] || null
        fields["Last Activity Date"] = v
        fields["Last activity Date"] = v
        fields["Ultima actividad"] = v
        fields["Última actividad"] = v
      }

      return pickDefined(fields)
    }

    // intenta patch con alias: si Airtable devuelve UNKNOWN_FIELD_NAME, lo reintenta quitando el campo problemático
    const patchWithFallback = async ({ table, id, fields }) => {
      // 1) primer intento con todo
      let resp = await airtablePatch(
        `https://api.airtable.com/v0/${baseId}/${table}/${id}`,
        { fields }
      )
      let data = await safeJson(resp)
      if (resp.ok) return { ok: true, data }

      // 2) si el error es unknown field, intentamos “limpiar” quitando campos uno por uno
      const errType =
        data?.error?.type ||
        data?.details?.error?.type ||
        data?.error?.message ||
        ""

      const isUnknown =
        String(errType).includes("UNKNOWN_FIELD_NAME") ||
        String(data?.error?.message || "").includes("UNKNOWN_FIELD_NAME")

      if (!isUnknown) {
        return { ok: false, status: resp.status, data }
      }

      // estrategia: intentamos con subsets “seguros” para que al menos guarde algo
      const safeSets = [
        // 1) básicos
        ["Email", "Position", "Status"],
        // 2) básicos + linkedin
        ["Email", "Position", "Status", "LinkedIn URL", "LinkedIn", "Linkedin"],
        // 3) básicos + phone
        [
          "Email",
          "Position",
          "Status",
          "Phone",
          "Numero de telefono",
          "Número de teléfono",
          "Telefono",
          "Teléfono"
        ],
        // 4) básicos + notes
        ["Email", "Position", "Status", "Notes", "Contact Notes", "Notas", "Observaciones", "Permanent Notes"],
        // 5) básicos + followup
        ["Email", "Position", "Status", "Next Follow-up Date", "Next follow-up Date", "Next Follow Up Date"]
      ]

      for (const keys of safeSets) {
        const attempt = {}
        keys.forEach((k) => {
          if (fields[k] !== undefined) attempt[k] = fields[k]
        })
        if (Object.keys(attempt).length === 0) continue

        resp = await airtablePatch(
          `https://api.airtable.com/v0/${baseId}/${table}/${id}`,
          { fields: attempt }
        )
        data = await safeJson(resp)
        if (resp.ok) return { ok: true, data, partial: true }
      }

      return { ok: false, status: resp.status, data }
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
        `https://api.airtable.com/v0/${baseId}/Companies?filterByFormula=${encodeURIComponent(formula)}`
      )
      const data = await safeJson(response)
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch companies", details: data })
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
        return res.status(response.status).json({ error: "Company not found", details: data })
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

      const check = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Companies/${id}`
      )
      const existing = await safeJson(check)
      if (!check.ok) {
        return res.status(check.status).json({ error: "Company not found", details: existing })
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
        return res.status(response.status).json({ error: "Failed to update company", details: data })
      }
      return res.status(200).json(data)
    }

    /* =====================================================
       GET CONTACTS
    ====================================================== */

    if (action === "getContacts") {
      const formula = `{Responsible Email}="${email}"`
      const contactsRes = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Contacts?filterByFormula=${encodeURIComponent(formula)}`
      )
      const contactsData = await safeJson(contactsRes)
      if (!contactsRes.ok) {
        return res.status(contactsRes.status).json({ error: "Failed to fetch contacts", details: contactsData })
      }
      return res.status(200).json(contactsData)
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
        return res.status(response.status).json({ error: "Contact not found", details: data })
      }

      if ((data.fields?.["Responsible Email"] || "").toLowerCase() !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      return res.status(200).json(data)
    }

    /* =====================================================
       UPDATE CONTACT  ✅ ARREGLADO (NOTES + PHONE + LINKEDIN + FOLLOWUP)
    ====================================================== */

    if (action === "updateContact") {
      const { id, fields } = body
      if (!id || !fields) return res.status(400).json({ error: "Missing data" })

      const check = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Contacts/${id}`
      )
      const existing = await safeJson(check)
      if (!check.ok) {
        return res.status(check.status).json({ error: "Contact not found", details: existing })
      }
      if ((existing.fields?.["Responsible Email"] || "").toLowerCase() !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      // construimos patch con alias para que matchee tu Airtable sí o sí
      const aliased = buildAliasedFields(fields)

      const patched = await patchWithFallback({
        table: "Contacts",
        id,
        fields: aliased
      })

      if (!patched.ok) {
        return res.status(patched.status || 500).json({
          error: "Failed to update contact",
          details: patched.data
        })
      }

      return res.status(200).json(patched.data)
    }

    /* =====================================================
       CREATE ACTIVITY ✅ ARREGLADO (Notes + Next Follow-up Date + Company safe)
    ====================================================== */

    if (action === "createActivity") {
      const { contactId, type, notes, nextFollowUp } = body

      if (!contactId || !type) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      // validar ownership por contacto
      const contactRes = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Contacts/${contactId}`
      )
      const contactData = await safeJson(contactRes)
      if (!contactRes.ok) {
        return res.status(contactRes.status).json({ error: "Failed to fetch contact", details: contactData })
      }
      if ((contactData.fields?.["Responsible Email"] || "").toLowerCase() !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      // company link recXXX si existe
      const rawCompany = contactData.fields?.Company
      const candidate = Array.isArray(rawCompany) && rawCompany.length ? rawCompany[0] : null
      const linkedCompanyId = typeof candidate === "string" && candidate.startsWith("rec") ? candidate : null

      // ⚠️ IMPORTANTÍSIMO:
      // - Activities Notes se llama "Notes" (en tu screenshot)
      // - Next Follow-up Date existe y es date
      const fieldsToSend = {
        "Activity Type": String(type),
        "Related Contact": [contactId],
        "Activity Date": new Date().toISOString(),
        "Owner Email": email,
        "Notes": typeof notes === "string" ? notes : ""
      }

      if (linkedCompanyId) fieldsToSend["Related Company"] = [linkedCompanyId]

      // si viene YYYY-MM-DD lo mandamos a Activities
      if (nextFollowUp) {
        fieldsToSend["Next Follow-up Date"] = nextFollowUp
      }

      const activityRes = await airtablePost(
        `https://api.airtable.com/v0/${baseId}/Activities`,
        { fields: fieldsToSend }
      )
      const activityData = await safeJson(activityRes)
      if (!activityRes.ok) {
        return res.status(activityRes.status).json({ error: "Failed to create activity", details: activityData })
      }

      // además actualizamos el contacto para que quede el resumen y próxima fecha
      // (si esto falla NO rompemos el createActivity)
      const contactPatch = {
        "Last Activity Date": new Date().toISOString()
      }
      if (nextFollowUp) contactPatch["Next Follow-up Date"] = nextFollowUp

      // status auto
      const currentStatus = contactData.fields?.Status || ""
      let nextStatus = currentStatus
      if (!currentStatus || currentStatus === "Not Contacted") {
        if (type === "Call" || type === "Email" || type === "LinkedIn") nextStatus = "Contacted"
      }
      if (type === "Meeting") nextStatus = "Meeting Booked"
      if (nextStatus && nextStatus !== currentStatus) contactPatch["Status"] = nextStatus

      try {
        await patchWithFallback({
          table: "Contacts",
          id: contactId,
          fields: buildAliasedFields(contactPatch)
        })
      } catch (e) {
        // no hacemos nada: la activity ya se creó
      }

      return res.status(200).json({ success: true, activity: activityData })
    }

    /* =====================================================
       GET ACTIVITIES ✅ (solo las tuyas + ordenadas)
    ====================================================== */

    if (action === "getActivities") {
      const { contactId } = req.query
      if (!contactId) return res.status(400).json({ error: "Missing contact ID" })

      // validar ownership por contacto
      const contactRes = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Contacts/${contactId}`
      )
      const contactData = await safeJson(contactRes)
      if (!contactRes.ok) {
        return res.status(contactRes.status).json({ error: "Failed to fetch contact", details: contactData })
      }
      if ((contactData.fields?.["Responsible Email"] || "").toLowerCase() !== email) {
        return res.status(403).json({ error: "Forbidden" })
      }

      const formula = `AND({Owner Email}="${email}", FIND("${contactId}", ARRAYJOIN({Related Contact})))`

      const response = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Activities?filterByFormula=${encodeURIComponent(formula)}`
      )
      const data = await safeJson(response)
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch activities", details: data })
      }

      const records = (data.records || []).sort(
        (a, b) => new Date(b.fields?.["Activity Date"] || 0) - new Date(a.fields?.["Activity Date"] || 0)
      )

      return res.status(200).json({ records })
    }

    /* =====================================================
       DASHBOARD STATS (sin tocarlo)
    ====================================================== */

    if (action === "getDashboardStats") {
      const contactsRes = await airtableGet(
        `https://api.airtable.com/v0/${baseId}/Contacts?filterByFormula=${encodeURIComponent(
          `{Responsible Email}="${email}"`
        )}`
      )
      const contactsData = await safeJson(contactsRes)
      if (!contactsRes.ok) {
        return res.status(500).json({ error: "Failed to load contacts", details: contactsData })
      }

      const contacts = contactsData.records || []
      const totalLeads = contacts.length
      const activeLeads = contacts.filter((c) => c.fields?.Status !== "Closed Lost").length
      const meetingsBooked = contacts.filter((c) => c.fields?.Status === "Meeting Booked").length
      const closedWon = contacts.filter((c) => c.fields?.Status === "Closed Won").length
      const conversionRate = totalLeads > 0 ? ((closedWon / totalLeads) * 100).toFixed(1) : 0
      const winRate = meetingsBooked > 0 ? ((closedWon / meetingsBooked) * 100).toFixed(1) : 0

      return res.status(200).json({
        totalLeads,
        activeLeads,
        meetingsBooked,
        closedWon,
        conversionRate,
        winRate
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
