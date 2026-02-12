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

    // ===== GET CONTACTS =====

    const contactsRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Contacts?filterByFormula=${encodeURIComponent(`{Responsible Email}='${email}'`)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`
        }
      }
    );

    const contactsData = await contactsRes.json();
    const contacts = contactsData.records || [];

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    let stats = {
      totalLeads: contacts.length,
      newLeads: 0,
      contacted: 0,
      replied: 0,
      meetingBooked: 0,
      closedWon: 0,
      closedLost: 0,
      activitiesThisWeek: 0,
      upcomingFollowUps: 0,
      overdueFollowUps: 0
    };

    contacts.forEach(contact => {
      const f = contact.fields;

      const created = new Date(f["Created At"]);
      if (created >= sevenDaysAgo) stats.newLeads++;

      switch (f.Status) {
        case "Contacted":
          stats.contacted++;
          break;
        case "Replied":
          stats.replied++;
          break;
        case "Meeting Booked":
          stats.meetingBooked++;
          break;
        case "Closed Won":
          stats.closedWon++;
          break;
        case "Closed Lost":
          stats.closedLost++;
          break;
      }
    });

    // ===== GET ACTIVITIES =====

    const activitiesRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Activities?filterByFormula=${encodeURIComponent(`{Owner Email}='${email}'`)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`
        }
      }
    );

    const activitiesData = await activitiesRes.json();
    const activities = activitiesData.records || [];

    activities.forEach(activity => {
      const f = activity.fields;

      const activityDate = new Date(f["Activity Date"]);
      if (activityDate >= sevenDaysAgo) stats.activitiesThisWeek++;

      if (f["Next Follow-up Date"]) {
        const followUp = new Date(f["Next Follow-up Date"]);

        if (followUp > now) stats.upcomingFollowUps++;
        if (followUp < now) stats.overdueFollowUps++;
      }
    });

    return res.status(200).json(stats);

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
