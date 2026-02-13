export default async function handler(req, res) {

  const { action } = req.query

  const body =
    req.method === "POST"
      ? typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body
      : {}

  /* =========================
     LOGIN (NO REQUIERE COOKIE)
  ========================== */

  if (action === "login") {

    const { email } = body

    if (!email) {
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

    res.setHeader(
      "Set-Cookie",
      `session=${normalized}; Path=/; HttpOnly; SameSite=Lax`
    )

    return res.status(200).json({ success: true })
  }

  /* =========================
     AUTH REQUIRED BELOW
  ========================== */

  const cookie = req.headers.cookie

  if (!cookie || !cookie.includes("session=")) {
    return res.status(401).json({ error: "Not authenticated" })
  }

  const email = cookie
    .split("session=")[1]
    ?.split(";")[0]
    ?.trim()
    ?.toLowerCase()

  const baseId = process.env.AIRTABLE_BASE_ID
  const token = process.env.AIRTABLE_TOKEN

  /* =========================
     GET COMPANIES
  ========================== */

  if (action === "getCompanies") {

    const formula = `{Responsible Email}="${email}"`

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Companies?filterByFormula=${encodeURIComponent(formula)}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const data = await response.json()
    return res.status(200).json(data)
  }

  /* =========================
     GET COMPANY
  ========================== */

  if (action === "getCompany") {

    const { id } = req.query

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Companies/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const data = await response.json()
    return res.status(200).json(data)
  }

  /* =========================
     UPDATE COMPANY
  ========================== */

  if (action === "updateCompany") {

    const { id, fields } = body

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Companies/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fields })
      }
    )

    const data = await response.json()
    return res.status(200).json(data)
  }

  /* =========================
     GET CONTACTS
  ========================== */

  if (action === "getContacts") {

    const formula = `{Responsible Email}="${email}"`

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Contacts?filterByFormula=${encodeURIComponent(formula)}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const data = await response.json()
    return res.status(200).json(data)
  }

  /* =========================
     GET CONTACT
  ========================== */

  if (action === "getContact") {

    const { id } = req.query

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Contacts/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const data = await response.json()
    return res.status(200).json(data)
  }

  /* =========================
     UPDATE CONTACT
  ========================== */

  if (action === "updateContact") {

    const { id, fields } = body

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Contacts/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fields })
      }
    )

    const data = await response.json()
    return res.status(200).json(data)
  }

  /* =========================
     CREATE ACTIVITY
  ========================== */

  if (action === "createActivity") {

    const { contactId, companyId, type, notes, nextFollowUp } = body

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Activities`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            "Activity Type": type,
            "Related Contact": [contactId],
            "Related Company": companyId ? [companyId] : [],
            "Activity Date": new Date().toISOString(),
            "Owner Email": email,
            "Notes": notes || "",
            "Next Follow-up Date": nextFollowUp || null
          }
        })
      }
    )

    const data = await response.json()
    return res.status(200).json(data)
  }

  /* =========================
     GET ACTIVITIES
  ========================== */

  if (action === "getActivities") {

    const { contactId } = req.query

    const formula = `FIND("${contactId}", ARRAYJOIN({Related Contact}))`

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Activities?filterByFormula=${encodeURIComponent(formula)}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const data = await response.json()

    const records = (data.records || []).sort(
      (a, b) =>
        new Date(b.fields["Activity Date"]) -
        new Date(a.fields["Activity Date"])
    )

    return res.status(200).json({ records })
  }

  /* =========================
     GET CALENDAR
  ========================== */

  if (action === "getCalendar") {

    const formula = `{Owner Email}="${email}"`

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Activities?filterByFormula=${encodeURIComponent(formula)}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const data = await response.json()
    return res.status(200).json(data)
  }

  /* =========================
     DASHBOARD STATS
  ========================== */

  if (action === "getDashboardStats") {

    const contactsRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/Contacts`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const activitiesRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/Activities`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const contacts = await contactsRes.json()
    const activities = await activitiesRes.json()

    const totalLeads = contacts.records?.length || 0

    const calls = activities.records?.filter(
      r => r.fields["Activity Type"] === "Call"
    ).length || 0

    const emails = activities.records?.filter(
      r => r.fields["Activity Type"] === "Email"
    ).length || 0

    const meetings = activities.records?.filter(
      r => r.fields["Activity Type"] === "Meeting"
    ).length || 0

    return res.status(200).json({
      totalLeads,
      calls,
      emails,
      meetings
    })
  }

  return res.status(400).json({ error: "Invalid action" })
}
