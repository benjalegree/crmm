const allowedUsers = [
  "benjamin.alegre@psicofunnel.com",
  "sarahduatorrss@gmail.com"
];

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email } = await request.json();

  if (!allowedUsers.includes(email)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, email }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session=${email}; HttpOnly; Path=/; Secure; SameSite=Strict`
      }
    }
  );
}
