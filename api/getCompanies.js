export default async function handler(req, res) {
  const { email } = req.query;

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
