export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, industry, country, responsibleEmail } = req.body;

  const response = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Companies`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              "Company Name": name,
              Industry: industry,
              Country: country,
              Status: "New",
              "Responsible Email": responsibleEmail,
            },
          },
        ],
      }),
    }
  );

  const data = await response.json();

  res.status(200).json(data);
}
