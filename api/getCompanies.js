export default async function handler(req, res) {

  try {

    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Companies`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`
        }
      }
    );

    const data = await response.json();

    return res.status(200).json({ records: data.records || [] });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
