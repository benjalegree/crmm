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

  const { contactId, type, notes } = req.body;

  if (!contactId || !type) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {

    const cleanType = type.trim();

    const fields = {
      "Activity Type": cleanType,
      "Related Contact": [contactId],
      "Owner Email": email,
      "Notes": notes ? notes.trim() : "",
      "Activity Date": new Date().toISOString().split("T")[0]
    };

    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Activities`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fields })
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
