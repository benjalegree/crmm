export default async function handler(req, res) {

  const cookie = req.headers.cookie;

  if (!cookie || !cookie.includes("session=")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const email = cookie
    .split("session=")[1]
    ?.split(";")[0]
    ?.trim()
    ?.toLowerCase();

  try {

    // 1️⃣ Traer Contacts filtrados por responsable
    const contactsResponse = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Contacts?filterByFormula={Responsible Email}='${email}'`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`
        }
      }
    );

    const contactsData = await contactsResponse.json();

    // 2️⃣ Traer Companies completas
    const companiesResponse = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Companies`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`
        }
      }
    );

    const companiesData = await companiesResponse.json();

    // 3️⃣ Crear mapa ID → Nombre
    const companyMap = {};
    companiesData.records.forEach(company => {
      companyMap[company.id] = company.fields["Company Name"];
    });

    // 4️⃣ Reemplazar ID por nombre real
    const enrichedContacts = contactsData.records.map(contact => {
      const companyId = contact.fields.Company?.[0];

      return {
        ...contact,
        fields: {
          ...contact.fields,
          CompanyName: companyMap[companyId] || null
        }
      };
    });

    return res.status(200).json({ records: enrichedContacts });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
