export default async function handler(request) {
  const cookie = request.headers.get("cookie");

  if (!cookie || !cookie.includes("session=")) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = cookie.split("session=")[1];

  return new Response(JSON.stringify({ email }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
