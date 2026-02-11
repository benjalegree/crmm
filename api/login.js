const allowedUsers = [
  "benjamin.alegre@psicofunnel.com",
  "sarahduatorrss@gmail.com"
];

export default async function handler(request) {

  if (request.method === "GET") {
    return new Response(JSON.stringify({ status: "login endpoint alive" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let { email } = body;

  if (!email) {
    return new Response(JSON.stringify({ error: "Email required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  email = email.trim().toLowerCase();

  if (!allowedUsers.includes(email)) {
    return new Respo
