import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const normalized = useMemo(() => email.trim().toLowerCase(), [email])

  const greetName = useMemo(() => {
    if (normalized === "benjamin.alegre@psicofunnel.com") return "Benjamin"
    if (normalized === "sarahduatorrss@gmail.com") return "Sarah"
    return ""
  }, [normalized])

  const login = async (e) => {
    e?.preventDefault?.()
    if (!email.trim()) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/crm?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })

      const data = await res.json().catch(() => ({}))

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

  useEffect(() => {
    // evita scroll “fantasma” en algunos navegadores
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div style={page}>
      {/* blobs suaves (no protagonista, pero da vida) */}
      <div style={blobA} />
      <div style={blobB} />
      <div style={grain} />

      <div style={wrap}>
        <div style={shell}>
          {/* LEFT PANEL */}
          <div style={left}>
            <div style={brandRow}>
              <div style={brandMark} />
              <div>
                <div style={brandName}>PsicoFunnel CRM</div>
                <div style={brandTag}>English green • glass UI</div>
              </div>
            </div>

            <div style={leftCopy}>
              <div style={kicker}>Workspace</div>
              <div style={headline}>
                {greetName ? `Welcome back, ${greetName}` : "Welcome back"}
              </div>
              <div style={subhead}>
                Un CRM limpio, rápido y legible. Seguimiento de leads, actividades y próximos follow-ups
                sin ruido visual.
              </div>

              <div style={chips}>
                <div style={chip}>Leads</div>
                <div style={chip}>Activities</div>
                <div style={chip}>Follow-ups</div>
              </div>
            </div>

            <div style={leftFade} />
          </div>

          {/* RIGHT PANEL */}
          <div style={right}>
            <div style={rightTop}>
              <div style={iconWrap} aria-hidden="true">
                <span style={icon}>✳</span>
              </div>
              <div style={title}>Sign in</div>
              <div style={desc}>Enter your email to continue.</div>
            </div>

            <form onSubmit={login} style={form}>
              <label style={label}>Email</label>

              <div style={inputWrap}>
                <input
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={input}
                  autoComplete="email"
                  inputMode="email"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  ...button,
                  ...(loading || !email.trim() ? buttonDisabled : null)
                }}
              >
                {loading ? "Logging in..." : "Continue"}
              </button>

              {error && <div style={errorBox}>{error}</div>}

              <div style={fineprint}>
                Tip: usa <strong>benjamin.alegre@psicofunnel.com</strong> o{" "}
                <strong>sarahduatorrss@gmail.com</strong>.
              </div>
            </form>
          </div>
        </div>

        <div style={bottomNote}>
          <span style={dot} />
          Secure session cookie • No-store cache • Minimal UI
        </div>
      </div>
    </div>
  )
}

/* =======================
   STYLES (Apple + glass)
======================= */

const page = {
  height: "100dvh",
  width: "100%",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, rgba(246,248,247,1) 0%, rgba(239,244,242,1) 100%)",
  position: "relative",
  overflow: "hidden",
  padding: 16
}

const wrap = {
  width: "min(980px, 96vw)",
  position: "relative",
  zIndex: 2
}

const shell = {
  width: "100%",
  height: "min(600px, 86dvh)",
  display: "grid",
  gridTemplateColumns: "1.05fr 1fr",
  borderRadius: 28,
  overflow: "hidden",
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.72)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.14)"
}

/* blobs suaves */
const blobA = {
  position: "absolute",
  width: 560,
  height: 560,
  borderRadius: 999,
  left: "-180px",
  top: "-220px",
  background:
    "radial-gradient(circle at 30% 30%, rgba(20,92,67,0.35), rgba(20,92,67,0.08), rgba(255,255,255,0))",
  filter: "blur(22px)",
  zIndex: 0,
  pointerEvents: "none"
}

const blobB = {
  position: "absolute",
  width: 620,
  height: 620,
  borderRadius: 999,
  right: "-220px",
  bottom: "-260px",
  background:
    "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.30), rgba(16,185,129,0.08), rgba(255,255,255,0))",
  filter: "blur(24px)",
  zIndex: 0,
  pointerEvents: "none"
}

/* grano sutil */
const grain = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)",
  backgroundSize: "6px 6px",
  opacity: 0.35,
  mixBlendMode: "soft-light",
  pointerEvents: "none",
  zIndex: 1
}

/* LEFT */
const left = {
  position: "relative",
  padding: 28,
  background:
    "linear-gradient(135deg, rgba(20,92,67,0.16) 0%, rgba(16,185,129,0.10) 45%, rgba(255,255,255,0.0) 100%)",
  borderRight: "1px solid rgba(0,0,0,0.06)"
}

const leftFade = {
  position: "absolute",
  inset: "auto 0 0 0",
  height: 180,
  background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 100%)",
  pointerEvents: "none"
}

const brandRow = {
  display: "flex",
  alignItems: "center",
  gap: 12
}

const brandMark = {
  width: 14,
  height: 14,
  borderRadius: 999,
  background: "linear-gradient(180deg, rgba(20,92,67,1) 0%, rgba(16,185,129,1) 100%)",
  boxShadow: "0 14px 30px rgba(16,185,129,0.26)"
}

const brandName = {
  fontWeight: 950,
  letterSpacing: -0.2,
  color: "#0f3d2e",
  fontSize: 13
}

const brandTag = {
  marginTop: 2,
  fontSize: 12,
  color: "rgba(15,61,46,0.55)",
  fontWeight: 800
}

const leftCopy = {
  marginTop: 90,
  maxWidth: 380
}

const kicker = {
  fontSize: 12,
  fontWeight: 950,
  color: "rgba(15,61,46,0.55)",
  letterSpacing: 0.9,
  textTransform: "uppercase"
}

const headline = {
  marginTop: 12,
  fontSize: 34,
  lineHeight: 1.06,
  fontWeight: 950,
  letterSpacing: -0.9,
  color: "#0b1f18"
}

const subhead = {
  marginTop: 12,
  fontSize: 13,
  lineHeight: 1.5,
  color: "rgba(0,0,0,0.55)",
  fontWeight: 700
}

const chips = {
  marginTop: 18,
  display: "flex",
  gap: 10,
  flexWrap: "wrap"
}

const chip = {
  padding: "8px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(0,0,0,0.06)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  fontSize: 12,
  fontWeight: 900,
  color: "rgba(0,0,0,0.65)"
}

/* RIGHT */
const right = {
  padding: 34,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(30px)",
  WebkitBackdropFilter: "blur(30px)"
}

const rightTop = { marginBottom: 18 }

const iconWrap = {
  width: 44,
  height: 44,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(0,0,0,0.04)",
  border: "1px solid rgba(0,0,0,0.06)",
  marginBottom: 14
}

const icon = {
  fontSize: 18,
  color: "rgba(15,61,46,0.70)"
}

const title = {
  fontSize: 26,
  fontWeight: 950,
  letterSpacing: -0.7,
  color: "#0b0b0b"
}

const desc = {
  marginTop: 8,
  fontSize: 13,
  color: "rgba(0,0,0,0.55)",
  fontWeight: 700
}

const form = {
  display: "flex",
  flexDirection: "column",
  gap: 10
}

const label = {
  fontSize: 12,
  fontWeight: 950,
  color: "rgba(0,0,0,0.60)"
}

const inputWrap = {
  borderRadius: 16,
  padding: 2,
  background:
    "linear-gradient(135deg, rgba(20,92,67,0.30) 0%, rgba(16,185,129,0.18) 35%, rgba(0,0,0,0.06) 100%)",
  boxShadow: "0 14px 30px rgba(0,0,0,0.08)"
}

const input = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.08)",
  outline: "none",
  background: "rgba(255,255,255,0.88)",
  fontSize: 13,
  fontWeight: 700
}

const button = {
  width: "100%",
  padding: "12px 14px",
  marginTop: 8,
  borderRadius: 14,
  border: "none",
  background: "#0b0b0b",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 950,
  boxShadow: "0 16px 34px rgba(0,0,0,0.18)"
}

const buttonDisabled = {
  opacity: 0.65,
  cursor: "not-allowed"
}

const errorBox = {
  marginTop: 10,
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)",
  fontWeight: 900,
  fontSize: 12
}

const fineprint = {
  marginTop: 10,
  fontSize: 12,
  color: "rgba(0,0,0,0.45)",
  fontWeight: 800
}

const bottomNote = {
  marginTop: 14,
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 12,
  color: "rgba(0,0,0,0.45)",
  fontWeight: 800,
  paddingLeft: 8
}

const dot = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "rgba(20,92,67,0.9)",
  boxShadow: "0 10px 18px rgba(16,185,129,0.22)"
}

/* Responsive */
const media = typeof window !== "undefined" ? window.matchMedia("(max-width: 860px)") : null
if (media?.matches) {
  shell.gridTemplateColumns = "1fr"
  shell.height = "auto"
  leftCopy.marginTop = 22
  right.padding = 22
  left.padding = 22
}
