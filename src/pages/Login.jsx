import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])

  const isValidEmail = useMemo(() => {
    if (!normalizedEmail) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  }, [normalizedEmail])

  const login = async () => {
    if (!normalizedEmail) return
    if (!isValidEmail) {
      setError("Email inválido.")
      return
    }

    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/crm?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail })
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data?.success) {
        navigate("/dashboard")
        return
      }
      setError(data?.error || "No se pudo iniciar sesión.")
    } catch {
      setError("Error de servidor.")
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === "Enter") login()
  }

  return (
    <div style={styles.screen}>
      {/* Fullscreen macOS-like wallpaper */}
      <div style={styles.wallpaper} aria-hidden="true" />
      <div style={styles.vignette} aria-hidden="true" />
      <div style={styles.grain} aria-hidden="true" />

      {/* Centered content, but NO card/window */}
      <main style={styles.center}>
        <h1 style={styles.brand}>PsicoFunnel</h1>

        <div style={styles.form}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Email"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            style={{
              ...styles.input,
              borderBottomColor: error
                ? "rgba(255,100,100,0.70)"
                : "rgba(255,255,255,0.28)"
            }}
          />

          <button
            onClick={login}
            disabled={loading || !isValidEmail}
            style={{
              ...styles.button,
              opacity: loading || !isValidEmail ? 0.55 : 1,
              cursor: loading || !isValidEmail ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Ingresando..." : "Login"}
          </button>

          {!!error && <div style={styles.error}>{error}</div>}
        </div>
      </main>
    </div>
  )
}

const styles = {
  screen: {
    minHeight: "100vh",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    background: "#cfd7df",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },

  // Fondo full-screen (inspirado en el screenshot)
  wallpaper: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(1200px 700px at 20% 15%, rgba(255,255,255,0.65), rgba(255,255,255,0) 55%)," +
      "radial-gradient(1000px 650px at 70% 20%, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%)," +
      "radial-gradient(900px 560px at 60% 80%, rgba(0,0,0,0), rgba(0,0,0,0.12) 70%)," +
      "linear-gradient(145deg, rgba(155,180,200,0.65), rgba(4,38,55,0.95))",
    filter: "saturate(1.05) contrast(1.02)"
  },

  vignette: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(900px 600px at 50% 40%, rgba(0,0,0,0), rgba(0,0,0,0.10) 72%, rgba(0,0,0,0.18) 100%)",
    pointerEvents: "none"
  },

  grain: {
    position: "absolute",
    inset: 0,
    opacity: 0.06,
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")",
    pointerEvents: "none"
  },

  center: {
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 26,
    padding: "40px 18px"
  },

  brand: {
    margin: 0,
    fontSize: 44,
    fontWeight: 700,
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.92)",
    textShadow: "0 16px 40px rgba(0,0,0,0.32)"
  },

  form: {
    width: 380,
    maxWidth: "82vw",
    display: "grid",
    gap: 18,
    justifyItems: "center"
  },

  input: {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.28)",
    padding: "12px 8px",
    fontSize: 15,
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    letterSpacing: 0.2
  },

  button: {
    width: 150,
    height: 36,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.26)",
    background: "rgba(0,0,0,0.10)",
    color: "rgba(255,255,255,0.90)",
    fontSize: 13,
    letterSpacing: 0.35,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "0 14px 34px rgba(0,0,0,0.22)"
  },

  error: {
    marginTop: 2,
    fontSize: 12.5,
    fontWeight: 650,
    color: "rgba(255,120,120,0.95)",
    textShadow: "0 10px 26px rgba(0,0,0,0.25)"
  }
}
