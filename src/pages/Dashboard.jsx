import { useEffect, useState } from "react"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [companies, setCompanies] = useState([])

  useEffect(() => {
    const init = async () => {

      const auth = await fetch("/api/me", {
        credentials: "include"
      })

      if (auth.status !== 200) {
        window.location.href = "/"
        return
      }

      const userData = await auth.json()
      setUser(userData.email)

      const res = await fetch("/api/getCompanies", {
        credentials: "include"
      })

      const data = await res.json()
      setCompanies(data.records || [])
    }

    init()
  }, [])

  return (
    <div>
      <h1>Overview</h1>
      <p>Logueado como: {user}</p>

      <div style={grid}>
        <Card title="Total Companies" value={companies.length} />
      </div>
    </div>
  )
}

function Card({ title, value }) {
  return (
    <div style={card}>
      <h3>{title}</h3>
      <p style={{fontSize:"28px", fontWeight:"bold"}}>{value}</p>
    </div>
  )
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
  marginTop: "30px"
}

const card = {
  background: "#ffffff",
  padding: "30px",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
}
