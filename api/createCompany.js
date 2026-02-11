export async function POST(request) {
  const body = await request.json();
  const { name, industry, country, responsibleEmail } = body;

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

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
