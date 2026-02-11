export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();

  return new Response(JSON.stringify({
    recibido: body,
    tipo: typeof body.email,
    valorExacto: body.email
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
