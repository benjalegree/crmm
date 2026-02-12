export default async function handler(req, res) {

  const cookie = req.headers.cookie;

  if (!cookie || !cookie.includes("session=")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const email = cookie
    .split("session=")[1]
    ?.split(";")[0]
    ?.trim()
    ?.toLowerCase();

  const { action } = req.query;
  const body = req.body || {};

  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TOKEN = process.env.AIRTABLE_TOKEN;

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json"
  };

  try {

    /* ===========================
       CONTACTS
    ============================ */

    if (action === "getContacts") {

      const formula = `{Responsible Email}='${email}'`;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Contacts?filterByFormula=${encodeURIComponent(formula)}`,
        { headers }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    if (action === "getContact") {

      const { id } = req.query;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Contacts/${id}`,
        { headers }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    if (action === "updateContact") {

      const { id, fields } = body;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Contacts/${id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ fields })
        }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    if (action === "createContact") {

      const { fields } = body;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Contacts`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            fields: {
              ...fields,
              "Responsible Email": email
            }
          })
        }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    /* ===========================
       COMPANIES
    ============================ */

    if (action === "getCompanies") {

      const formula = `{Responsible Email}='${email}'`;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Companies?filterByFormula=${encodeURIComponent(formula)}`,
        { headers }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    if (action === "getCompany") {

      const { id } = req.query;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Companies/${id}`,
        { headers }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    if (action === "createCompany") {

      const { fields } = body;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Companies`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            fields: {
              ...fields,
              "Responsible Email": email
            }
          })
        }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    if (action === "updateCompany") {

      const { id, fields } = body;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Companies/${id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ fields })
        }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    /* ===========================
       ACTIVITIES
    ============================ */

    if (action === "createActivity") {

      const { contactId, companyId, type, notes, nextFollowUp } = body;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Activities`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            fields: {
              "Activity Type": type,
              "Related Contact": [contactId],
              "Related Company": companyId ? [companyId] : undefined,
              "Activity Date": new Date().toISOString(),
              "Next Follow-up Date": nextFollowUp || null,
              "Owner Email": email,
              "Notes": notes || ""
            }
          })
        }
      );

      const data = await response.json();
      return res.status(200).json(data);
    }

    if (action === "getActivities") {

      const { contactId } = req.query;

      const formula = `AND(FIND("${contactId}", ARRAYJOIN({Related Contact})), {Owner Email}='${email}')`;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Activities?filterByFormula=${encodeURIComponent(formula)}`,
        { headers }
      );

      const data = await response.json();

      const records = (data.records || []).sort((a, b) =>
        new Date(b.fields["Activity Date"]) -
        new Date(a.fields["Activity Date"])
      );

      return res.status(200).json({ records });
    }

    if (action === "getCalendar") {

      const formula = `{Owner Email}='${email}'`;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Activities?filterByFormula=${encodeURIComponent(formula)}`,
        { headers }
      );

      const data = await response.json();

      const events = (data.records || [])
        .filter(r => r.fields["Next Follow-up Date"])
        .map(r => ({
          id: r.id,
          title: r.fields["Activity Type"],
          date: r.fields["Next Follow-up Date"],
          contact: r.fields["Contact Name"]
        }));

      return res.status(200).json({ events });
    }

    /* ===========================
       DASHBOARD
    ============================ */

    if (action === "getDashboardStats") {

      const formula = `{Responsible Email}='${email}'`;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Contacts?filterByFormula=${encodeURIComponent(formula)}`,
        { headers }
      );

      const data = await response.json();

      const contacts = data.records || [];

      const stats = {
        totalLeads: contacts.length,
        contacted: contacts.filter(c => c.fields.Status === "Contacted").length,
        replied: contacts.filter(c => c.fields.Status === "Replied").length,
        meetings: contacts.filter(c => c.fields.Status === "Meeting Booked").length,
        closed: contacts.filter(c => c.fields.Status === "Closed Won").length
      };

      return res.status(200).json(stats);
    }

    return res.status(400).json({ error: "Invalid action" });

  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
}
