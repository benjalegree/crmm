export default async function handler(req, res) {

  const { action } = req.query
  const body = req.body || {}

  const baseId = process.env.AIRTABLE_BASE_ID
  const token = process.env.AIRTABLE_TOKEN

  /* ================= LOGIN ================= */

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

    const expires = new Date()
    expires.setDate(expires.getDate() + 7)

    res.setHeader(
      "Set-Cookie",
      `session=${normalized}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}`
    )

    return res.status(200).json({ success: true })
  }

  /* ================= CHECK SESSION ================= */

  if (action === "me") {

    const cookie = req.headers.cookie

    if (!cookie || !cookie.includes("session=")) {
      return res.status(401).json({ authenticated: false })
    }

    const email = cookie
      .split("session=")[1]
      ?.split(";")[0]
      ?.trim()
      ?.toLowerCase()

    return res.status(200).json({
      authenticated: true,
      email
    })
  }

  /* ================= AUTH REQUIRED ================= */

  const cookie = req.headers.cookie

  if (!cookie || !cookie.includes("session=")) {
    return res.status(401).json({ error: "Not authenticated" })
  }

  const email = cookie
    .split("session=")[1]
    ?.split(";")[0]
    ?.trim()
    ?.toLowerCase()

  /* ================= GET COMPANIES ================= */

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

  /* ================= GET CONTACTS ================= */

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

  /* ================= UPDATE CONTACT ================= */

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

  /* ================= CREATE ACTIVITY ================= */

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

  return res.status(400).json({ error: "Invalid action" })
}
