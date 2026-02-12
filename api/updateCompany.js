export default async function handler(req, res) {

  const cookie = req.headers.cookie

  if (!cookie || !cookie.includes("session=")) {
    return res.status(401).json({ error: "Not authenticated" })
  }

  const { id, field, value } = req.body

  const response = await fetch(
    `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Companies/${id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          [field]: value
        }
      })
    }
  )

  const data = await response.json()

  res.status(200).json(data)
}
