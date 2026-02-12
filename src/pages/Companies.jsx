import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Companies() {

  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    setLoading(true)

    const res = await fetch("/api/crm?action=getCompanies", {
      credentials: "include"
    })

    const data = await res.json()

    setCompanies(data.records || [])
    setLoading(false)
  }

  if (loading) return <div>Loading companies...</div>

  return (
    <div>
      <h1>Companies</h1>

      <div style={table}>
        {companies.map(company => (
          <div
            key={company.id}
            style={row}
            onClick={() => navigate(`/companies/${company.id}`)}
          >
            <div>{company.fields["Company Name"]}</div>
            <div>{company.fields.Industry}</div>
            <div>{company.fields.Country}</div>
            <Status status={company.fields.Status} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Status({ status }) {
  const colors = {
    "New": "#007aff",
    "Contacted": "#ff9500",
    "Replied": "#5856d6",
    "Meeting Booked": "#34c759",
    "Closed Won": "#30d158",
    "Closed Lost": "#ff3b30"
  }

  return (
    <span style={{
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      background: colors[status] || "#ccc",
      color: "white"
    }}>
      {status}
    </span>
  )
}

const table = {
  marginTop: "30px",
  background: "#fff",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
}

const row = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  padding: "20px",
  borderBottom: "1px solid #f0f0f0",
  cursor: "pointer"
}
