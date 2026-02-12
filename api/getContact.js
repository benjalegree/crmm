export default async function handler(req, res) {

  const cookie = req.headers.cookie;

  if (!cookie || !cookie.includes("session=")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get("id");

  if (!id) {
    return res.status(400).json({ error: "Missing ID" });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Contacts/${id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
