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
      setError("Ingresá un email válido.")
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
    } catch (err) {
      setError("Error de servidor.")
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === "Enter") login()
  }

  return (
    <div style={styles.page}>
      {/* Background */}
      <div style={styles.bg} aria-hidden="true" />
      <div style={styles.grain} aria-hidden="true" />

      <div style={styles.wrap}>
        <div style={styles.card}>
          {/* Brand */}
          <div style={styles.header}>
            <div style={styles.mark} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 14.5c0 2.9 2.3 5.2 5.2 5.2h1.6c2.9 0 5.2-2.3 5.2-5.2V9.5c0-2.9-2.3-5.2-5.2-5.2h-1.6C8.3 4.3 6 6.6 6 9.5v5z"
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth="1.8"
                />
                <path
                  d="M9 9.4h6"
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div style={styles.brandText}>
              <div style={styles.title}>PsicoFunnel CRM</div>
              <div style={styles.sub}>Iniciar sesión</div>
            </div>
          </div>

          {/* Input */}
          <div style={styles.form}>
            <label style={styles.label}>Email</label>

            <div
              style={{
                ...styles.inputShell,
                borderColor: error
                  ? "rgba(255,59,48,0.55)"
                  : "rgba(0,0,0,0.10)"
              }}
            >
              <span style={styles.icon} aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4.5 7.5A3 3 0 0 1 7.5 4.5h9A3 3 0 0 1 19.5 7.5v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9z"
                    stroke="rgba(0,0,0,0.55)"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M6.8 8.3 12 12l5.2-3.7"
                    stroke="rgba(0,0,0,0.55)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <input
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="email"
                inputMode="email"
                style={styles.input}
              />
            </div>

            {error ? <div style={styles.error}>{error}</div> : <div style={styles.helper} />}
          </div>

          {/* CTA */}
          <button
            onClick={login}
            disabled={loading || !isValidEmail}
            style={{
              ...styles.button,
              opacity: loading || !isValidEmail ? 0.55 : 1,
              cursor: loading || !isValidEmail ? "not-allowed" : "pointer"
            }}
          >
            <span style={styles.btnLabel}>
              {loading ? "Ingresando..." : "Entrar"}
            </span>

            <span style={styles.btnIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h12"
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M13 6l6 6-6 6"
                  stroke="rgba(255,255,255,0.95)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>

          {/* Tiny footer (sin textos raros) */}
          <div style={styles.tiny}>
            <span style={styles.dot} aria-hidden="true" />
            <span style={styles.tinyText}>Conexión segura</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "grid",
    placeItems: "center",
    position: "relative",
    overflow: "hidden",
    background: "#f5f5f7",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },

  bg: {
    position: "absolute",
    inset: "-35%",
    background:
      "radial-gradient(900px 560px at 22% 18%, rgba(0,122,255,0.18), rgba(0,0,0,0) 60%)," +
      "radial-gradient(900px 520px at 78% 22%, rgba(175,82,222,0.14), rgba(0,0,0,0) 60%)," +
      "radial-gradient(1100px 700px at 50% 90%, rgba(52,199,89,0.10), rgba(0,0,0,0) 62%)",
    filter: "blur(18px)",
    transform: "translateZ(0)"
  },

  grain: {
    position: "absolute",
    inset: 0,
    opacity: 0.06,
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E\")"
  },

  wrap: {
    position: "relative",
    padding: 24,
    width: "100%",
    display: "grid",
    placeItems: "center"
  },

  card: {
    width: 390,
    maxWidth: "92vw",
    borderRadius: 26,
    padding: 22,
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow:
      "0 28px 70px rgba(0,0,0,0.10), 0 2px 12px rgba(0,0,0,0.05)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)"
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "4px 2px 14px 2px"
  },

  mark: {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.94), rgba(0,0,0,0.78))",
    boxShadow: "0 16px 34px rgba(0,0,0,0.20)"
  },

  brandText: { display: "grid", gap: 2 },

  title: {
    fontSize: 18,
    fontWeight: 750,
    letterSpacing: -0.2,
    color: "rgba(0,0,0,0.92)",
    lineHeight: 1.1
  },

  sub: {
    fontSize: 12.5,
    color: "rgba(0,0,0,0.55)"
  },

  form: {
    display: "grid",
    gap: 10,
    marginTop: 6
  },

  label: {
    fontSize: 12,
    fontWeight: 650,
    color: "rgba(0,0,0,0.72)",
    letterSpacing: 0.2
  },

  inputShell: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(255,255,255,0.78)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 22px rgba(0,0,0,0.06)"
  },

  icon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "rgba(0,0,0,0.04)",
    border: "1px solid rgba(0,0,0,0.05)"
  },

  input: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 14.5,
    color: "rgba(0,0,0,0.92)"
  },

  helper: {
    height: 16
  },

  error: {
    marginTop: -4,
    fontSize: 12.5,
    fontWeight: 650,
    color: "rgba(255,59,48,0.95)"
  },

  button: {
    width: "100%",
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.12)",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.92), rgba(0,0,0,0.80))",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    boxShadow:
      "0 18px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.10)"
  },

  btnLabel: {
    fontSize: 14.5,
    fontWeight: 750,
    letterSpacing: 0.2
  },

  btnIcon: {
    display: "grid",
    placeItems: "center",
    opacity: 0.95
  },

  tiny: {
    marginTop: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    color: "rgba(0,0,0,0.55)",
    fontSize: 12
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: "rgba(0,122,255,0.9)"
  },

  tinyText: {
    fontWeight: 600
  }
}
