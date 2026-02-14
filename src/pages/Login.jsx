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

  const styles = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "28px",
        background:
          "radial-gradient(1200px 800px at 15% 20%, rgba(10, 86, 54, 0.12), transparent 55%)," +
          "radial-gradient(1000px 700px at 85% 80%, rgba(10, 86, 54, 0.10), transparent 55%)," +
          "linear-gradient(180deg, #F7F8F7 0%, #F2F4F2 55%, #EEF1EF 100%)",
        color: "#0E1A12",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", system-ui, sans-serif'
      },
      shell: {
        width: "100%",
        maxWidth: "980px",
        display: "grid",
        gridTemplateColumns: "1.2fr 0.8fr",
        gap: "22px",
        alignItems: "stretch"
      },
      shellMobile: {
        gridTemplateColumns: "1fr",
        maxWidth: "520px"
      },

      leftPanel: {
        position: "relative",
        borderRadius: "28px",
        padding: "34px",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, rgba(8, 58, 36, 0.92) 0%, rgba(9, 84, 53, 0.92) 50%, rgba(11, 66, 43, 0.92) 100%)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.16)",
        color: "rgba(255,255,255,0.92)"
      },
      leftGlow: {
        position: "absolute",
        inset: "-40%",
        background:
          "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.14), transparent 45%)," +
          "radial-gradient(circle at 70% 80%, rgba(255,255,255,0.10), transparent 55%)," +
          "radial-gradient(circle at 60% 30%, rgba(122, 255, 190, 0.10), transparent 55%)",
        filter: "blur(2px)"
      },
      noise: {
        position: "absolute",
        inset: 0,
        opacity: 0.06,
        backgroundImage:
          "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22160%22 height=%22160%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E')",
        mixBlendMode: "overlay",
        pointerEvents: "none"
      },
      leftContent: {
        position: "relative",
        zIndex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "22px"
      },
      brandRow: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
      },
      mark: {
        width: "38px",
        height: "38px",
        borderRadius: "12px",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.10) 100%)",
        border: "1px solid rgba(255,255,255,0.20)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        display: "grid",
        placeItems: "center",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)"
      },
      markDot: {
        width: "10px",
        height: "10px",
        borderRadius: "999px",
        background: "rgba(190,255,222,0.95)",
        boxShadow: "0 0 0 6px rgba(190,255,222,0.14)"
      },
      brandText: {
        display: "flex",
        flexDirection: "column",
        lineHeight: 1.15
      },
      brandName: {
        fontSize: "14px",
        letterSpacing: "0.3px",
        fontWeight: 650,
        margin: 0
      },
      brandSub: {
        fontSize: "12px",
        opacity: 0.78,
        marginTop: "3px"
      },
      heroTitle: {
        margin: "0",
        fontSize: "30px",
        letterSpacing: "-0.5px",
        fontWeight: 750
      },
      heroDesc: {
        margin: "10px 0 0 0",
        fontSize: "14px",
        opacity: 0.86,
        maxWidth: "48ch",
        lineHeight: 1.5
      },
      chips: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginTop: "18px"
      },
      chip: {
        fontSize: "12px",
        padding: "8px 10px",
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.10)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)"
      },
      bottomNote: {
        fontSize: "12px",
        opacity: 0.72,
        lineHeight: 1.5
      },

      card: {
        borderRadius: "28px",
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(18, 44, 28, 0.10)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.10)",
        padding: "26px",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "14px"
      },
      cardTitle: {
        margin: 0,
        fontSize: "18px",
        fontWeight: 750,
        letterSpacing: "-0.2px",
        color: "#0E1A12"
      },
      cardSubtitle: {
        margin: "0 0 6px 0",
        fontSize: "13px",
        color: "rgba(14, 26, 18, 0.72)",
        lineHeight: 1.5
      },

      label: {
        fontSize: "12px",
        fontWeight: 650,
        color: "rgba(14, 26, 18, 0.70)",
        marginTop: "8px"
      },
      inputWrap: {
        position: "relative",
        marginTop: "6px"
      },
      input: {
        width: "100%",
        padding: "14px 14px",
        borderRadius: "14px",
        border: "1px solid rgba(18, 44, 28, 0.14)",
        background: "rgba(255,255,255,0.92)",
        outline: "none",
        fontSize: "14px",
        color: "#0E1A12",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)"
      },
      hint: {
        marginTop: "8px",
        fontSize: "12px",
        color: "rgba(14, 26, 18, 0.58)"
      },

      button: {
        marginTop: "14px",
        width: "100%",
        padding: "12px 14px",
        borderRadius: "14px",
        border: "1px solid rgba(8, 58, 36, 0.20)",
        background:
          "linear-gradient(180deg, rgba(8,58,36,0.98) 0%, rgba(7,48,30,0.98) 100%)",
        color: "rgba(255,255,255,0.96)",
        fontSize: "14px",
        fontWeight: 700,
        letterSpacing: "0.2px",
        cursor: "pointer",
        boxShadow:
          "0 16px 30px rgba(8,58,36,0.22), inset 0 1px 0 rgba(255,255,255,0.18)",
        transition: "transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease"
      },
      buttonDisabled: {
        opacity: 0.65,
        cursor: "not-allowed"
      },

      error: {
        margin: "10px 0 0 0",
        fontSize: "12px",
        color: "#B42318",
        background: "rgba(180, 35, 24, 0.08)",
        border: "1px solid rgba(180, 35, 24, 0.18)",
        padding: "10px 12px",
        borderRadius: "14px"
      },

      footer: {
        marginTop: "10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px",
        fontSize: "12px",
        color: "rgba(14, 26, 18, 0.55)"
      },
      link: {
        color: "rgba(8, 58, 36, 0.92)",
        textDecoration: "none",
        fontWeight: 700
      },

      // simple responsive helper (JS-driven)
      hiddenOnMobile: {
        display: "block"
      }
    }),
    []
  )

  // lightweight responsive toggle without CSS files
  const isNarrow =
    typeof window !== "undefined" ? window.matchMedia("(max-width: 860px)").matches : false

  return (
    <div style={styles.page}>
      <div style={{ ...styles.shell, ...(isNarrow ? styles.shellMobile : null) }}>
        {/* Left / brand panel */}
        <section style={{ ...styles.leftPanel, ...(isNarrow ? { display: "none" } : null) }}>
          <div style={styles.leftGlow} />
          <div style={styles.noise} />

          <div style={styles.leftContent}>
            <div>
              <div style={styles.brandRow}>
                <div style={styles.mark} aria-hidden="true">
                  <div style={styles.markDot} />
                </div>
                <div style={styles.brandText}>
                  <p style={styles.brandName}>PsicoFunnel CRM</p>
                  <div style={styles.brandSub}>Acceso interno • Estilo premium</div>
                </div>
              </div>

              <div style={{ marginTop: "26px" }}>
                <h1 style={styles.heroTitle}>Ingresar al panel</h1>
                <p style={styles.heroDesc}>
                  Diseño limpio, enfoque ejecutivo y un verde inglés sobrio. Todo listo para trabajar sin
                  ruido.
                </p>

                <div style={styles.chips}>
                  <span style={styles.chip}>Seguridad por cookie</span>
                  <span style={styles.chip}>UI minimal</span>
                  <span style={styles.chip}>Experiencia </span>
                </div>
              </div>
            </div>

            <div style={styles.bottomNote}>
              Tip: usa el mismo email con el que tenés sesión en el CRM. Si el backend responde OK, te
              manda directo al dashboard.
            </div>
          </div>
        </section>

        {/* Right / login card */}
        <section style={styles.card}>
          <div>
            <h2 style={styles.cardTitle}>Acceso</h2>
            <p style={styles.cardSubtitle}>Ingresá tu email para entrar al dashboard.</p>
          </div>

          <div>
            <div style={styles.label}>Email</div>
            <div style={styles.inputWrap}>
              <input
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                autoComplete="email"
                inputMode="email"
              />
            </div>
            <div style={styles.hint}>No se comparte con terceros. Solo para autenticar sesión.</div>
          </div>

          <button
            onClick={login}
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : null)
            }}
            onMouseDown={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(1px)"
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(0px)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0px)"
            }}
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.footer}>
            <span>© {new Date().getFullYear()} PsicoFunnel</span>
            <a style={styles.link} href="/" onClick={(e) => e.preventDefault()}>
              Soporte
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
