import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const isValidEmail = useMemo(() => {
    const v = email.trim()
    // simple + suficiente
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  }, [email])

  const login = async () => {
    const normalized = email.trim().toLowerCase()
    if (!normalized || !isValidEmail) {
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
        body: JSON.stringify({ email: normalized })
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data?.success) {
        navigate("/dashboard")
        return
      }

      setError(data?.error || "Login failed")
    } catch (err) {
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
      <div style={styles.bg} aria-hidden="true" />

      <div style={styles.shell}>
        <div style={styles.card}>
          <div style={styles.brandRow}>
            <div style={styles.logo} aria-hidden="true">
              PF
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={styles.title}>PsicoFunnel CRM</div>
              <div style={styles.subtitle}>Acceso seguro</div>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="email"
              inputMode="email"
              style={{
                ...styles.input,
                borderColor: error ? "rgba(255,59,48,0.55)" : "rgba(0,0,0,0.10)"
              }}
            />
            <div style={styles.hint}>
              {error ? (
                <span style={styles.errorText}>{error}</span>
              ) : (
                <span style={{ opacity: 0.75 }}>
                  Usá el email autorizado para tu cuenta.
                </span>
              )}
            </div>
          </div>

          <button
            onClick={login}
            disabled={loading || !isValidEmail}
            style={{
              ...styles.button,
              opacity: loading || !isValidEmail ? 0.65 : 1,
              cursor: loading || !isValidEmail ? "not-allowed" : "pointer"
            }}
          >
            <span style={styles.buttonText}>
              {loading ? "Ingresando..." : "Entrar"}
            </span>
            <span style={styles.buttonArrow} aria-hidden="true">
              →
            </span>
          </button>

          <div style={styles.footerRow}>
            <div style={styles.footerLeft}>© {new Date().getFullYear()} PsicoFunnel</div>
            <div style={styles.footerRight}>v1</div>
          </div>
        </div>

        <div style={styles.note} aria-hidden="true">
          <div style={styles.noteDot} />
          <div style={styles.noteText}>
            Estilo “Apple”: fondo suave, glass card, tipografía limpia, sombras sutiles.
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    height: "100vh",
    width: "100%",
    display: "grid",
    placeItems: "center",
    position: "relative",
    overflow: "hidden",
    background: "#f5f5f7",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },

  // fondo tipo macOS con blobs suaves
  bg: {
    position: "absolute",
    inset: "-20%",
    background:
      "radial-gradient(800px 500px at 25% 20%, rgba(0,122,255,0.20), rgba(0,0,0,0) 55%)," +
      "radial-gradient(700px 450px at 75% 30%, rgba(88,86,214,0.18), rgba(0,0,0,0) 55%)," +
      "radial-gradient(900px 600px at 50% 90%, rgba(52,199,89,0.12), rgba(0,0,0,0) 60%)",
    filter: "blur(14px)",
    transform: "translateZ(0)"
  },

  shell: {
    position: "relative",
    display: "grid",
    gap: 14,
    alignItems: "center",
    justifyItems: "center",
    padding: 24
  },

  card: {
    width: 360,
    maxWidth: "90vw",
    background: "rgba(255,255,255,0.70)",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 22,
    padding: 22,
    boxShadow:
      "0 24px 60px rgba(0,0,0,0.10), 0 2px 10px rgba(0,0,0,0.05)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)"
  },

  brandRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 16
  },

  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    letterSpacing: 0.5,
    color: "rgba(255,255,255,0.95)",
    background:
      "linear-gradient(135deg, rgba(0,0,0,0.92), rgba(0,0,0,0.75))",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)"
  },

  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "rgba(0,0,0,0.92)",
    lineHeight: 1.1
  },

  subtitle: {
    fontSize: 12.5,
    color: "rgba(0,0,0,0.60)",
    marginTop: 3
  },

  field: {
    display: "grid",
    gap: 8,
    marginTop: 8,
    marginBottom: 14
  },

  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(0,0,0,0.70)",
    letterSpacing: 0.2
  },

  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.10)",
    outline: "none",
    background: "rgba(255,255,255,0.85)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
    fontSize: 14.5,
    color: "rgba(0,0,0,0.92)"
  },

  hint: {
    minHeight: 18,
    fontSize: 12,
    color: "rgba(0,0,0,0.55)"
  },

  errorText: {
    color: "rgba(255,59,48,0.95)",
    fontWeight: 600
  },

  button: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.92), rgba(0,0,0,0.82))",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    boxShadow:
      "0 16px 34px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
    transition: "transform 120ms ease"
  },

  buttonText: {
    fontSize: 14.5,
    fontWeight: 700,
    letterSpacing: 0.2
  },

  buttonArrow: {
    fontSize: 16,
    opacity: 0.9,
    transform: "translateY(-0.5px)"
  },

  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    fontSize: 12,
    color: "rgba(0,0,0,0.45)"
  },

  footerLeft: { opacity: 0.9 },
  footerRight: {
    padding: "3px 8px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.06)",
    border: "1px solid rgba(0,0,0,0.06)",
    color: "rgba(0,0,0,0.55)"
  },

  note: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    background: "rgba(255,255,255,0.55)",
    border: "1px solid rgba(0,0,0,0.06)",
    borderRadius: 999,
    padding: "8px 12px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    maxWidth: 520
  },

  noteDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "rgba(0,122,255,0.9)"
  },

  noteText: {
    fontSize: 12.5,
    color: "rgba(0,0,0,0.55)"
  }
}
