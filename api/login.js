const allowedUsers = [
  "benjamin.alegre@psicofunnel.com",
  "sarahduatorrss@gmail.com"
];

export default async function handler(req, res) {

  if (req.method === "GET") {
    return res.status(200).json({ status: "login endpoint alive" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!allowedUsers.includes(cleanEmail)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.setHeader(
    "Set-Cookie",
    `session=${cleanEmail}; HttpOnly; Path=/; SameSite=Lax`
  );

  return res.status(200).json({ success: true, email: cleanEmail });
}
