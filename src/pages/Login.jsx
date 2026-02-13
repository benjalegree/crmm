import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Login() {

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const login = async () => {

    if (!email) return

    setLoading(true)
    setError("")

    try {

      const res = await fetch("/api/crm?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        navigate("/dashboard")
      } else {
        setError(data.error || "Login failed")
      }

    } catch (err) {
      setError("Server error")
    }

    setLoading(false)
  }

  return (
    <div style={container}>
      <div style={card}>
        <h2>PsicoFunnel CRM</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={input}
        />

        <button
          onClick={login}
          disabled={loading}
          style={{
            ...button,
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Logging in..." : "Entrar"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  )
}

const container = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f5f5f7"
}

const card = {
  background: "white",
  padding: "40px",
  borderRadius: "20px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
  width: "320px",
  textAlign: "center"
}

const input = {
  width: "100%",
  padding: "12px",
  marginTop: "20px",
  borderRadius: "10px",
  border: "1px solid #ddd"
}

const button = {
  width: "100%",
  padding: "12px",
  marginTop: "20px",
  borderRadius: "10px",
  border: "none",
  background: "black",
  color: "white",
  cursor: "pointer"
}
