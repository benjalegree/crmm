export default async function handler(req, res) {

  const cookie = req.headers.cookie;

  if (!cookie || !cookie.includes("session=")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const email = cookie
    .split("session=")[1]
    .split(";")[0];

  const formula = `{Responsible Email}="${email}"`;

  const response = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Companies?filterByFormula=${encodeURIComponent(formula)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
      },
    }
  );

  const data = await response.json();

  res.status(200).json(data);
}
