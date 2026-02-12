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

  try {

    const formula = `{Owner Email}='${email}'`;

    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Activities?filterByFormula=${encodeURIComponent(formula)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`
        }
      }
    );

    const data = await response.json();
    const records = data.records || [];

    const events = records
      .filter(r => r.fields["Next Follow-up Date"])
      .map(r => ({
        id: r.id,
        title: `${r.fields["Activity Type"]} – ${r.fields["Notes"] || ""}`,
        date: r.fields["Next Follow-up Date"],
        contactId: r.fields["Related Contact"]?.[0],
        overdue: new Date(r.fields["Next Follow-up Date"]) < new Date()
      }));

    return res.status(200).json({ events });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
