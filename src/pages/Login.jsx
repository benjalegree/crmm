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
      setError(data?.error || "Login failed")
    } catch {
      setError("Server error")
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === "Enter") login()
  }

  return (
    <div style={styles.page}>
      <div style={styles.wallpaper} aria-hidden="true" />
      <div style={styles.vignette} aria-hidden="true" />

      <div style={styles.window} role="dialog" aria-label="PsicoFunnel Login">
        <div style={styles.titlebar} aria-hidden="true">
          <div style={styles.traffic}>
            <span style={{ ...styles.dot, background: "#ff5f57" }} />
            <span style={{ ...styles.dot, background: "#febc2e" }} />
            <span style={{ ...styles.dot, background: "#28c840" }} />
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.brand}>
            <div style={styles.brandText}>PsicoFunnel</div>
          </div>

          <div style={styles.form}>
            <div style={styles.field}>
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
                  borderBottomColor: error ? "rgba(255,80,80,0.55)" : "rgba(255,255,255,0.28)"
                }}
              />
            </div>

            <button
              onClick={login}
              disabled={loading || !isValidEmail}
              style={{
                ...styles.button,
                opacity: loading || !isValidEmail ? 0.55 : 1,
                cursor: loading || !isValidEmail ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {!!error && <div style={styles.error}>{error}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    position: "relative",
    overflow: "hidden",
    background: "#cfd7df",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },

  // Fondo suave tipo macOS (sin textos)
  wallpaper: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(1200px 700px at 20% 15%, rgba(255,255,255,0.65), rgba(255,255,255,0) 55%)," +
      "radial-gradient(1100px 680px at 80% 20%, rgba(255,255,255,0.40), rgba(255,255,255,0) 55%)," +
      "linear-gradient(180deg, rgba(215,225,235,1), rgba(195,205,215,1))",
    filter: "blur(0px)"
  },

  vignette: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(900px 600px at 50% 40%, rgba(0,0,0,0), rgba(0,0,0,0.10) 70%, rgba(0,0,0,0.16) 100%)",
    pointerEvents: "none"
  },

  // Ventana
  window: {
    width: 980,
    maxWidth: "92vw",
    height: 520,
    maxHeight: "82vh",
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 30px 90px rgba(0,0,0,0.28)",
    border: "1px solid rgba(0,0,0,0.14)",
    background:
      "linear-gradient(135deg, rgba(210,220,230,0.35), rgba(20,70,92,0.80))"
  },

  titlebar: {
    height: 32,
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    background: "rgba(255,255,255,0.06)",
    borderBottom: "1px solid rgba(255,255,255,0.08)"
  },

  traffic: {
    display: "flex",
    gap: 7,
    alignItems: "center"
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 99,
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.18)"
  },

  // Panel interior estilo screenshot (gradiente/blur)
  panel: {
    height: "calc(100% - 32px)",
    display: "grid",
    placeItems: "center",
    position: "relative",
    background:
      "radial-gradient(900px 520px at 30% 15%, rgba(255,255,255,0.20), rgba(255,255,255,0) 55%)," +
      "radial-gradient(900px 520px at 70% 25%, rgba(255,255,255,0.12), rgba(255,255,255,0) 55%)," +
      "linear-gradient(145deg, rgba(95,125,145,0.55), rgba(4,38,55,0.92))",
    filter: "saturate(1.04)"
  },

  brand: {
    position: "absolute",
    top: 86,
    left: "50%",
    transform: "translateX(-50%)",
    textAlign: "center"
  },

  brandText: {
    fontSize: 38,
    fontWeight: 700,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.92)",
    textShadow: "0 10px 30px rgba(0,0,0,0.25)"
  },

  form: {
    width: 360,
    maxWidth: "78vw",
    display: "grid",
    gap: 18,
    alignItems: "center",
    justifyItems: "center",
    marginTop: 40
  },

  field: {
    width: "100%"
  },

  input: {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.28)",
    padding: "10px 6px",
    fontSize: 14,
    color: "rgba(255,255,255,0.90)",
    outline: "none",
    letterSpacing: 0.2
  },

  button: {
    width: 140,
    height: 34,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.26)",
    background: "rgba(0,0,0,0.10)",
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    letterSpacing: 0.3,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)"
  },

  error: {
    marginTop: 4,
    fontSize: 12.5,
    fontWeight: 600,
    color: "rgba(255,120,120,0.95)",
    textShadow: "0 8px 24px rgba(0,0,0,0.20)"
  }
}
