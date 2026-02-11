export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

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

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
