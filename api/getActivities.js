export default async function handler(req, res) {

  const cookie = req.headers.cookie;

  if (!cookie || !cookie.includes("session=")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const contactId = url.searchParams.get("contactId");

  if (!contactId) {
    return res.status(400).json({ error: "Missing contactId" });
  }

  try {

    const formula = `FIND("${contactId}", ARRAYJOIN({Related Contact}))`;

    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Activities?filterByFormula=${encodeURIComponent(formula)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`
        }
      }
    );

    const data = await response.json();

    const sorted = (data.records || []).sort((a, b) =>
      new Date(b.fields["Activity Date"]) -
      new Date(a.fields["Activity Date"])
    );

    return res.status(200).json({ records: sorted });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
