import { useState } from "react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

  const login = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email })
    })

    const data = await res.json()

    if (res.status === 200 && data.success) {
      window.location.href = "/dashboard"
    } else {
      setError(data.error || "Error")
    }
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
        <button onClick={login} style={button}>Entrar</button>
        <p style={{color:"red"}}>{error}</p>
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
  width: "300px",
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
