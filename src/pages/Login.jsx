import { useMemo, useState } from "react"
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

  const s = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        background:
          // “verde inglés” + look suave tipo Apple
          "radial-gradient(900px 650px at 20% 15%, rgba(220,255,235,0.10), transparent 55%)," +
          "radial-gradient(1000px 700px at 80% 85%, rgba(210,255,232,0.08), transparent 58%)," +
          "linear-gradient(135deg, #063A24 0%, #075034 35%, #05311F 100%)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", system-ui, sans-serif',
        color: "rgba(255,255,255,0.92)",
        position: "relative"
      },

      // leve textura / grano
      noise: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.06,
        backgroundImage:
          "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22160%22 height=%22160%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E')",
        mixBlendMode: "overlay"
      },

      // “pantalla completa”, sin burbuja/card:
      center: {
        width: "min(520px, 92vw)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "18px",
        textAlign: "center",
        transform: "translateY(-8px)"
      },

      brand: {
        fontSize: "30px",
        fontWeight: 800,
        letterSpacing: "-0.6px",
        margin: 0,
        textShadow: "0 10px 30px rgba(0,0,0,0.30)"
      },

      sub: {
        margin: "4px 0 0 0",
        fontSize: "13px",
        opacity: 0.78,
        lineHeight: 1.4
      },

      form: {
        marginTop: "18px",
        width: "min(420px, 92vw)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        alignItems: "center"
      },

      // Inputs tipo macOS: sin caja, solo línea
      inputWrap: {
        width: "100%"
      },
      input: {
        width: "100%",
        padding: "14px 4px 12px 4px",
        background: "transparent",
        border: "none",
        borderBottom: "1px solid rgba(255,255,255,0.30)",
        color: "rgba(255,255,255,0.92)",
        fontSize: "14px",
        letterSpacing: "0.2px",
        outline: "none",
        textAlign: "center"
      },

      button: {
        marginTop: "16px",
        padding: "10px 34px",
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.30)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        fontSize: "13px",
        fontWeight: 700,
        letterSpacing: "0.25px",
        cursor: "pointer",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.20)",
        transition: "transform 160ms ease, opacity 160ms ease, border-color 160ms ease"
      },
      buttonDisabled: {
        opacity: 0.55,
        cursor: "not-allowed"
      },

      error: {
        marginTop: "12px",
        fontSize: "12px",
        color: "rgba(255, 220, 220, 0.95)",
        background: "rgba(180, 35, 24, 0.14)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        padding: "10px 12px",
        borderRadius: "14px",
        width: "min(420px, 92vw)"
      },

      // Footer sutil
      footer: {
        position: "absolute",
        bottom: "18px",
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: "12px",
        opacity: 0.58,
        letterSpacing: "0.2px"
      }
    }),
    []
  )

  return (
    <div style={s.page}>
      <div style={s.noise} />

      <div style={s.center}>
        <div>
          <h1 style={s.brand}>PsicoFunnel</h1>
          <p style={s.sub}>Acceso al CRM</p>
        </div>

        <div style={s.form}>
          <div style={s.inputWrap}>
            <input
              style={s.input}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              onKeyDown={(e) => {
                if (e.key === "Enter") login()
              }}
            />
          </div>

          <button
            onClick={login}
            disabled={loading}
            style={{ ...s.button, ...(loading ? s.buttonDisabled : null) }}
            onMouseDown={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(1px)"
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(0px)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0px)"
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)"
            }}
          >
            {loading ? "Ingresando..." : "Login"}
          </button>

          {error && <div style={s.error}>{error}</div>}
        </div>
      </div>

      <div style={s.footer}>© {new Date().getFullYear()} PsicoFunnel</div>
    </div>
  )
}
