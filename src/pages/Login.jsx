import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const nav = useNavigate()

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")

  const readJson = async (res) => {
    try {
      return await res.json()
    } catch {
      return {}
    }
  }

  const safeErr = (data, fallback) =>
    data?.error || data?.details?.error?.message || data?.details?.error || data?.details?.message || fallback

  useEffect(() => {
    // si ya está logueado, saltá al dashboard
    ;(async () => {
      try {
        const res = await fetch(`/api/crm?action=me`, { credentials: "include" })
        const data = await readJson(res)
        if (res.ok && data?.authenticated) nav("/", { replace: true })
      } catch {
        // ignore
      }
    })()
    // eslint-disable-next-line
  }, [])

  const normalized = useMemo(() => email.trim().toLowerCase(), [email])

  const hintName = useMemo(() => {
    if (normalized === "benjamin.alegre@psicofunnel.com") return "Benjamin"
    if (normalized === "sarahduatorrss@gmail.com") return "Sarah"
    return ""
  }, [normalized])

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr("")

    const val = normalized
    if (!val) return setErr("Please enter your email.")
    if (!val.includes("@")) return setErr("Please enter a valid email.")

    setLoading(true)
    try {
      const res = await fetch(`/api/crm?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: val })
      })
      const data = await readJson(res)

      if (!res.ok) {
        setErr(safeErr(data, "Login failed"))
        setLoading(false)
        return
      }

      nav("/", { replace: true })
    } catch {
      setErr("Login failed")
    }
    setLoading(false)
  }

  return (
    <div style={page}>
      <div style={card}>
        {/* LEFT PANEL (GREEN GRADIENT) */}
        <div style={left}>
          <div style={brandRow}>
            <div style={brandDot} />
            <div style={brandText}>PsicoFunnel CRM</div>
          </div>

          <div style={leftContent}>
            <div style={leftKicker}>Your workspace</div>
            <div style={leftTitle}>
              Get clarity on your leads and follow-ups — in one calm place.
            </div>
            <div style={leftSub}>
              Minimal, fast and focused. Glass details. Everything where it should be.
            </div>
          </div>

          <div style={leftGlow} />
        </div>

        {/* RIGHT PANEL */}
        <div style={right}>
          <div style={rightTop}>
            <div style={starWrap} aria-hidden="true">
              <span style={star}>✳</span>
            </div>

            <h2 style={rightTitle}>
              {hintName ? `Welcome back, ${hintName}` : "Welcome back"}
            </h2>
            <p style={rightSub}>
              Enter your email to access your CRM.
            </p>
          </div>

          <form onSubmit={onSubmit} style={form}>
            <label style={label}>Your email</label>
            <input
              style={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              autoComplete="email"
              inputMode="email"
            />

            {err ? <div style={errBox}>{err}</div> : null}

            <button type="submit" style={{ ...btn, ...(loading ? btnDisabled : null) }} disabled={loading}>
              {loading ? "Signing in..." : "Continue"}
            </button>

            <div style={finePrint}>
              By continuing, you agree to keep access secure.
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

/* =========================
   STYLES — MATCH REFERENCE
========================= */

const page = {
  minHeight: "100vh",
  width: "100%",
  display: "grid",
  placeItems: "center",
  padding: 18,
  background: "linear-gradient(180deg, rgba(245,247,246,1) 0%, rgba(240,244,242,1) 100%)",
  overflow: "hidden"
}

const card = {
  width: "min(980px, 96vw)",
  height: "min(560px, 86vh)",
  display: "grid",
  gridTemplateColumns: "1.05fr 1fr",
  borderRadius: 28,
  overflow: "hidden",
  background: "rgba(255,255,255,0.9)",
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.12)"
}

/* Left */
const left = {
  position: "relative",
  padding: 26,
  background:
    "radial-gradient(1200px 600px at 20% 20%, rgba(16,185,129,0.20) 0%, rgba(16,185,129,0.10) 35%, rgba(16,185,129,0.00) 65%), linear-gradient(135deg, rgba(15,61,46,0.14) 0%, rgba(20,92,67,0.12) 35%, rgba(16,185,129,0.08) 70%, rgba(255,255,255,0.00) 100%), linear-gradient(135deg, rgba(20,92,67,0.10) 0%, rgba(16,185,129,0.12) 100%)"
}

const brandRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 950,
  color: "#0f3d2e",
  letterSpacing: -0.2
}

const brandDot = {
  width: 12,
  height: 12,
  borderRadius: 999,
  background: "linear-gradient(180deg, rgba(20,92,67,1) 0%, rgba(16,185,129,1) 100%)",
  boxShadow: "0 10px 22px rgba(16,185,129,0.25)"
}

const brandText = { fontSize: 13 }

const leftContent = {
  marginTop: 110,
  maxWidth: 340
}

const leftKicker = {
  fontSize: 12,
  fontWeight: 900,
  color: "rgba(15,61,46,0.60)",
  letterSpacing: 0.8,
  textTransform: "uppercase"
}

const leftTitle = {
  marginTop: 12,
  fontSize: 28,
  lineHeight: 1.08,
  fontWeight: 950,
  color: "#0f3d2e",
  letterSpacing: -0.6
}

const leftSub = {
  marginTop: 12,
  fontSize: 13,
  color: "rgba(15,61,46,0.70)",
  lineHeight: 1.45
}

// glow blur circle bottom
const leftGlow = {
  position: "absolute",
  inset: "auto -120px -160px auto",
  width: 360,
  height: 360,
  borderRadius: 999,
  background: "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.55), rgba(16,185,129,0.08), rgba(255,255,255,0))",
  filter: "blur(18px)",
  pointerEvents: "none"
}

/* Right */
const right = {
  padding: 34,
  background: "rgba(255,255,255,0.92)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center"
}

const rightTop = { marginBottom: 16 }

const starWrap = {
  width: 44,
  height: 44,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(0,0,0,0.04)",
  border: "1px solid rgba(0,0,0,0.06)",
  marginBottom: 14
}

const star = {
  fontSize: 18,
  color: "rgba(15,61,46,0.75)"
}

const rightTitle = {
  margin: 0,
  fontSize: 28,
  fontWeight: 950,
  letterSpacing: -0.6,
  color: "#0b1f18"
}

const rightSub = {
  margin: "10px 0 0 0",
  fontSize: 13,
  color: "rgba(0,0,0,0.55)",
  lineHeight: 1.45
}

const form = {
  marginTop: 10,
  display: "flex",
  flexDirection: "column",
  gap: 10
}

const label = {
  fontSize: 12,
  color: "rgba(0,0,0,0.60)",
  fontWeight: 900
}

const input = {
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.10)",
  outline: "none",
  background: "rgba(255,255,255,0.95)",
  fontSize: 13,
  boxShadow: "0 10px 24px rgba(0,0,0,0.06)"
}

const btn = {
  marginTop: 8,
  padding: "12px 14px",
  borderRadius: 14,
  border: "none",
  background: "#0b0b0b",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 14px 28px rgba(0,0,0,0.18)"
}

const btnDisabled = {
  opacity: 0.7,
  cursor: "not-allowed"
}

const errBox = {
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)",
  fontWeight: 800,
  fontSize: 12
}

const finePrint = {
  marginTop: 8,
  fontSize: 12,
  color: "rgba(0,0,0,0.45)",
  fontWeight: 800
}
