import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ children }) {

  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {

    const res = await fetch("/api/crm?action=me", {
      credentials: "include"
    })

    if (res.status === 200) {
      setAuthenticated(true)
    }

    setLoading(false)
  }

  if (loading) return <div>Checking session...</div>

  if (!authenticated) return <Navigate to="/" />

  return children
}
