import { useEffect, useState } from "react"

export default function Dashboard() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/me", {
        credentials: "include"
      })

      if (res.status !== 200) {
        window.location.href = "/"
        return
      }

      const data = await res.json()
      setUser(data.email)
    }

    checkAuth()
  }, [])

  return (
    <div style={{padding:"40px", fontFamily:"-apple-system"}}>
      <h1>Dashboard</h1>
      <p>Logueado como: {user}</p>
    </div>
  )
}
