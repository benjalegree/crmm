export default async function handler(req, res) {

  const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

  const allowedUsers = [
    "benjamin.alegre@psicofunnel.com",
    "sarahduatorrss@gmail.com"
  ];

  const getSessionEmail = () => {
    const cookie = req.headers.cookie;
    if (!cookie || !cookie.includes("session=")) return null;
    return cookie.split("session=")[1]?.split(";")[0]?.trim()?.toLowerCase();
  };

  const requireAuth = () => {
    const email = getSessionEmail();
    if (!email) {
      res.status(401).json({ error: "Not authenticated" });
      return null;
    }
    return email;
  };

  const airtableFetch = async (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  };

  try {

    const { action } = req.query;

    // ---------------- LOGIN ----------------
    if (action === "login") {
      const { email } = req.body;
      const cleanEmail = email?.trim().toLowerCase();

      if (!allowedUsers.includes(cleanEmail)) {
        return res.status(401).json({ error: "Not authorized" });
      }

      res.setHeader(
        "Set-Cookie",
        `session=${cleanEmail}; Path=/; HttpOnly; SameSite=Lax`
      );

      return res.status(200).json({ success: true });
    }

    // All other actions require auth
    const email = requireAuth();
    if (!email) return;

    // ---------------- COMPANIES ----------------
    if (action === "getCompanies") {

      const formula = `{Responsible Email}='${email}'`;

      const response = await airtableFetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/Companies?filterByFormula=${encodeURIComponent(formula)}`
      );

      const data = await response.json();
      return res.status(200).json({ records: data.records || [] });
    }

    // ---------------- CONTACTS ----------------
    if (action === "getContacts") {

      const formula = `{Responsible Email}='${email}'`;

      const response = await airtableFetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/Contacts?filterByFormula=${encodeURIComponent(formula)}`
      );

      const data = await response.json();
      return res.status(200).json({ records: data.records || [] });
    }

    // ---------------- SINGLE CONTACT ----------------
    if (action === "getContact") {

      const { id } = req.query;

      const response = await airtableFetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/Contacts/${id}`
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    // ---------------- UPDATE CONTACT ----------------
    if (action === "updateContact") {

      const { id, fields } = req.body;

      const response = await airtableFetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/Contacts/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ fields })
        }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    // ---------------- CREATE ACTIVITY ----------------
    if (action === "createActivity") {

      const { contactId, companyId, type, notes } = req.body;

      const response = await airtableFetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/Activities`,
        {
          method: "POST",
          body: JSON.stringify({
            fields: {
              "Activity Type": type,
              "Related Contact": [contactId],
              "Related Company": companyId ? [companyId] : undefined,
              "Activity Date": new Date().toISOString(),
              "Owner Email": email,
              "Notes": notes || ""
            }
          })
        }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    // ---------------- GET ACTIVITIES ----------------
    if (action === "getActivities") {

      const { contactId } = req.query;

      const formula = `FIND("${contactId}", ARRAYJOIN({Related Contact}))`;

      const response = await airtableFetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/Activities?filterByFormula=${encodeURIComponent(formula)}`
      );

      const data = await response.json();

      const records = (data.records || []).sort((a, b) =>
        new Date(b.fields["Activity Date"]) -
        new Date(a.fields["Activity Date"])
      );

      return res.status(200).json({ records });
    }

    // ---------------- DASHBOARD ----------------
    if (action === "getDashboard") {

      const formula = `{Responsible Email}='${email}'`;

      const response = await airtableFetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/Contacts?filterByFormula=${encodeURIComponent(formula)}`
      );

      const data = await response.json();
      const records = data.records || [];

      const stats = {
        totalLeads: records.length,
        contacted: records.filter(r => r.fields.Status === "Contacted").length,
        replied: records.filter(r => r.fields.Status === "Replied").length,
        meetings: records.filter(r => r.fields.Status === "Meeting Booked").length
      };

      return res.status(200).json(stats);
    }

    // ---------------- CALENDAR ----------------
    if (action === "getCalendar") {

      const formula = `AND({Responsible Email}='${email}', {Next Follow-up Date}!='')`;

      const response = await airtableFetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/Contacts?filterByFormula=${encodeURIComponent(formula)}`
      );

      const data = await response.json();
      return res.status(200).json({ records: data.records || [] });
    }

    return res.status(400).json({ error: "Invalid action" });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
