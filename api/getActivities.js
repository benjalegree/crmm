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

  const url = new URL(req.url, `http://${req.headers.host}`);
  const contactId = url.searchParams.get("contactId");

  if (!contactId) {
    return res.status(400).json({ error: "Missing contactId" });
  }

  try {

    // Traemos solo actividades del usuario
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

    // Filtramos en backend por contacto vinculado
    const records = (data.records || []).filter(record => {
      const related = record.fields["Related Contact"] || [];
      return related.includes(contactId);
    });

    records.sort((a, b) =>
      new Date(b.fields["Activity Date"] || 0) -
      new Date(a.fields["Activity Date"] || 0)
    );

    return res.status(200).json({ records });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
