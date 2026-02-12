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

  const { contactId, companyId, type, notes } = req.body;

  if (!contactId || !type) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {

    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Activities`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            "Activity Type": type,
            "Related Contact": [contactId],
            "Related Company": companyId ? [companyId] : [],
            "Activity Date": new Date().toISOString(),
            "Owner Email": email,
            "Notes": notes || ""
          }
        })
      }
    );

    const data = await response.json();

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
