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
    return "there"
  }, [normalized])

  useEffect(() => {
    // Evita scroll “fantasma” + bordes blancos
    const prevHtml = document.documentElement.style.height
    const prevBody = document.body.style.height
    const prevOverflow = document.body.style.overflow
    document.documentElement.style.height = "100%"
    document.body.style.height = "100%"
    document.body.style.overflow = "hidden"
    return () => {
      document.documentElement.style.height = prevHtml
      document.body.style.height = prevBody
      document.body.style.overflow = prevOverflow
    }
  }, [])

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
        body: JSON.stringify({ email: normalized })
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

  return (
    <div style={page}>
      {/* fondo suave estilo “Starline” */}
      <div style={bgGradientA} />
      <div style={bgGradientB} />
      <div style={grain} />

      <div style={frame}>
        {/* TOP BAR */}
        <div style={topBar}>
          <div style={brand}>
            <div style={brandIcon} />
            <div>
              <div style={brandName}>PsicoFunnel CRM</div>
              <div style={brandSub}>English green • glass UI</div>
            </div>
          </div>

          <div style={topIcons}>
            <button type="button" style={topIconBtn} aria-label="Search">
              <span style={topIconGlyph}>⌕</span>
            </button>
            <button type="button" style={topIconBtn} aria-label="Notifications">
              <span style={topIconGlyph}>⟡</span>
              <span style={badge}>2</span>
            </button>
            <button type="button" style={avatarBtn} aria-label="Profile">
              <span style={avatarDot} />
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div style={content}>
          {/* LEFT “sidebar” similar a la imagen */}
          <div style={side}>
            <div style={sideGroup}>
              <div style={sideTitle}>Menu</div>

              <div style={sideList}>
                <div style={{ ...sideItem, ...sideItemActive }}>
                  <span style={sideDot} />
                  <span>Dashboard</span>
                </div>

                <div style={sideItem}>
                  <span style={sideDotSoft} />
                  <span>Contacts</span>
                </div>

                <div style={sideItem}>
                  <span style={sideDotSoft} />
                  <span>Companies</span>
                </div>

                <div style={sideItem}>
                  <span style={sideDotSoft} />
                  <span>Activities</span>
                </div>
              </div>
            </div>

            <div style={sideFooter}>
              <div style={sideHelp}>
                <span style={sideDotSoft} />
                <span>Help</span>
              </div>
            </div>
          </div>

          {/* RIGHT “panel” full width (no burbuja chica) */}
          <div style={main}>
            <div style={hero}>
              <div>
                <div style={hello}>Welcome, {greetName}</div>
                <div style={subtitle}>Enter your email to access your workspace.</div>
              </div>
            </div>

            <div style={panel}>
              <form onSubmit={login} style={form}>
                <div style={field}>
                  <label style={label}>Email</label>

                  <div style={inputWrap}>
                    <input
                      style={input}
                      placeholder="benjamin.alegre@psicofunnel.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      inputMode="email"
                    />
                  </div>
                </div>

                <div style={row}>
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    style={{
                      ...btn,
                      ...(loading || !email.trim() ? btnDisabled : null)
                    }}
                  >
                    {loading ? "Logging in..." : "Continue"}
                  </button>

                  <div style={hint}>
                    Allowed:
                    <div style={hintStrong}>benjamin.alegre@psicofunnel.com</div>
                    <div style={hintStrong}>sarahduatorrss@gmail.com</div>
                  </div>
                </div>

                {error ? <div style={errorBox}>{error}</div> : null}
              </form>
            </div>

            {/* “table ghost” para que se vea como dashboard (estético, no funcional) */}
            <div style={tableShell}>
              <div style={tableHeader}>
                <div style={th}>Lead</div>
                <div style={th}>Company</div>
                <div style={th}>Status</div>
                <div style={th} />
              </div>

              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={tr}>
                  <div style={td}>
                    <div style={cellLineStrong} />
                    <div style={cellLine} />
                  </div>
                  <div style={td}>
                    <div style={cellLineStrong} />
                    <div style={cellLine} />
                  </div>
                  <div style={td}>
                    <div style={pillGhost} />
                  </div>
                  <div style={tdRight}>
                    <div style={kebab} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={footerNote}>
          <span style={greenDot} />
          Secure session cookie • No-store cache • Minimal UI
        </div>
      </div>
    </div>
  )
}

/* =======================
   STYLES — full screen, like reference
======================= */

const page = {
  height: "100vh",
  width: "100vw",
  position: "relative",
  overflow: "hidden",
  background: "#eef1ef"
}

const bgGradientA = {
  position: "absolute",
  inset: "-20%",
  background:
    "radial-gradient(circle at 20% 35%, rgba(20,92,67,0.20) 0%, rgba(20,92,67,0.08) 28%, rgba(255,255,255,0) 60%)",
  filter: "blur(18px)",
  pointerEvents: "none"
}

const bgGradientB = {
  position: "absolute",
  inset: "-30%",
  background:
    "radial-gradient(circle at 80% 80%, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0.10) 30%, rgba(255,255,255,0) 62%)",
  filter: "blur(22px)",
  pointerEvents: "none"
}

const grain = {
  position: "absolute",
  inset: 0,
  backgroundImage: "radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)",
  backgroundSize: "6px 6px",
  opacity: 0.35,
  mixBlendMode: "soft-light",
  pointerEvents: "none"
}

const frame = {
  position: "relative",
  zIndex: 2,
  height: "100%",
  width: "100%",
  padding: 18,
  boxSizing: "border-box"
}

/* top bar */
const topBar = {
  height: 64,
  borderRadius: 18,
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(0,0,0,0.06)",
  backdropFilter: "blur(26px)",
  WebkitBackdropFilter: "blur(26px)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.10)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 16px"
}

const brand = { display: "flex", alignItems: "center", gap: 12 }
const brandIcon = {
  width: 16,
  height: 16,
  borderRadius: 6,
  background: "linear-gradient(180deg, rgba(20,92,67,1) 0%, rgba(16,185,129,1) 100%)",
  boxShadow: "0 16px 30px rgba(16,185,129,0.25)"
}
const brandName = { fontWeight: 950, fontSize: 13, color: "rgba(0,0,0,0.82)", letterSpacing: -0.2 }
const brandSub = { marginTop: 2, fontSize: 12, color: "rgba(0,0,0,0.45)", fontWeight: 800 }

const topIcons = { display: "flex", alignItems: "center", gap: 10 }
const topIconBtn = {
  width: 38,
  height: 38,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  position: "relative"
}
const topIconGlyph = { fontSize: 16, color: "rgba(0,0,0,0.55)", fontWeight: 900 }
const badge = {
  position: "absolute",
  right: 6,
  top: 6,
  width: 16,
  height: 16,
  borderRadius: 999,
  background: "rgba(255, 59, 48, 0.9)",
  color: "#fff",
  fontSize: 10,
  fontWeight: 900,
  display: "grid",
  placeItems: "center",
  border: "2px solid rgba(255,255,255,0.7)"
}

const avatarBtn = {
  width: 42,
  height: 42,
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center"
}
const avatarDot = {
  width: 18,
  height: 18,
  borderRadius: 999,
  background: "linear-gradient(180deg, rgba(20,92,67,1) 0%, rgba(16,185,129,1) 100%)"
}

/* layout */
const content = {
  marginTop: 14,
  height: "calc(100% - 64px - 14px - 36px)",
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  gap: 14
}

/* sidebar */
const side = {
  borderRadius: 18,
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(0,0,0,0.06)",
  backdropFilter: "blur(26px)",
  WebkitBackdropFilter: "blur(26px)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.10)",
  padding: 14,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: 0
}

const sideGroup = {}
const sideTitle = {
  fontSize: 12,
  fontWeight: 950,
  color: "rgba(0,0,0,0.45)",
  letterSpacing: 0.6,
  textTransform: "uppercase",
  marginBottom: 10
}

const sideList = { display: "flex", flexDirection: "column", gap: 10 }
const sideItem = {
  height: 44,
  borderRadius: 14,
  background: "rgba(255,255,255,0.35)",
  border: "1px solid rgba(0,0,0,0.04)",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 12px",
  fontWeight: 900,
  color: "rgba(0,0,0,0.70)"
}
const sideItemActive = {
  background: "rgba(20,92,67,0.14)",
  border: "1px solid rgba(20,92,67,0.14)"
}
const sideDot = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "rgba(20,92,67,0.85)"
}
const sideDotSoft = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "rgba(0,0,0,0.20)"
}

const sideFooter = { paddingTop: 12 }
const sideHelp = {
  height: 44,
  borderRadius: 14,
  background: "rgba(255,255,255,0.35)",
  border: "1px solid rgba(0,0,0,0.04)",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 12px",
  fontWeight: 900,
  color: "rgba(0,0,0,0.60)"
}

/* main */
const main = {
  borderRadius: 18,
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(0,0,0,0.06)",
  backdropFilter: "blur(26px)",
  WebkitBackdropFilter: "blur(26px)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.10)",
  padding: 16,
  minHeight: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column"
}

const hero = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "6px 6px 12px 6px"
}
const hello = { fontSize: 26, fontWeight: 950, letterSpacing: -0.7, color: "rgba(0,0,0,0.80)" }
const subtitle = { marginTop: 6, fontSize: 13, fontWeight: 800, color: "rgba(0,0,0,0.45)" }

const panel = {
  borderRadius: 18,
  background: "rgba(255,255,255,0.40)",
  border: "1px solid rgba(0,0,0,0.05)",
  padding: 14,
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)"
}

const form = { display: "flex", flexDirection: "column", gap: 12 }
const field = { display: "flex", flexDirection: "column", gap: 8 }
const label = { fontSize: 12, fontWeight: 950, color: "rgba(0,0,0,0.55)" }

const inputWrap = {
  borderRadius: 16,
  padding: 2,
  background:
    "linear-gradient(135deg, rgba(20,92,67,0.26) 0%, rgba(16,185,129,0.16) 35%, rgba(0,0,0,0.06) 100%)"
}

const input = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.08)",
  outline: "none",
  background: "rgba(255,255,255,0.84)",
  fontSize: 13,
  fontWeight: 800,
  boxSizing: "border-box"
}

const row = { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }

const btn = {
  height: 44,
  padding: "0 16px",
  borderRadius: 14,
  border: "none",
  background: "#0b0b0b",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(0,0,0,0.18)"
}

const btnDisabled = { opacity: 0.65, cursor: "not-allowed" }

const hint = {
  fontSize: 12,
  fontWeight: 900,
  color: "rgba(0,0,0,0.45)",
  lineHeight: 1.25
}
const hintStrong = { color: "rgba(0,0,0,0.65)", fontWeight: 950 }

const errorBox = {
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,0,0,0.08)",
  color: "#7a1d1d",
  border: "1px solid rgba(255,0,0,0.12)",
  fontWeight: 900,
  fontSize: 12
}

/* table skeleton */
const tableShell = {
  marginTop: 12,
  borderRadius: 18,
  background: "rgba(255,255,255,0.40)",
  border: "1px solid rgba(0,0,0,0.05)",
  padding: 12,
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  overflow: "hidden",
  flex: 1,
  minHeight: 0
}

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1.2fr 0.8fr 50px",
  gap: 10,
  padding: "10px 10px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.45)",
  border: "1px solid rgba(0,0,0,0.04)"
}

const th = {
  fontSize: 12,
  fontWeight: 950,
  color: "rgba(0,0,0,0.45)"
}

const tr = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1.2fr 0.8fr 50px",
  gap: 10,
  padding: "10px 10px",
  borderRadius: 14,
  marginTop: 10,
  background: "rgba(255,255,255,0.28)",
  border: "1px solid rgba(0,0,0,0.03)"
}

const td = { display: "flex", flexDirection: "column", gap: 6 }
const tdRight = { display: "grid", placeItems: "center" }

const cellLineStrong = {
  height: 10,
  borderRadius: 999,
  background: "rgba(0,0,0,0.12)",
  width: "70%"
}
const cellLine = {
  height: 8,
  borderRadius: 999,
  background: "rgba(0,0,0,0.08)",
  width: "50%"
}

const pillGhost = {
  height: 22,
  width: 90,
  borderRadius: 999,
  background: "rgba(20,92,67,0.14)",
  border: "1px solid rgba(20,92,67,0.14)"
}

const kebab = {
  width: 16,
  height: 16,
  borderRadius: 999,
  background: "radial-gradient(circle, rgba(0,0,0,0.28) 25%, transparent 26%)",
  backgroundSize: "6px 6px",
  backgroundPosition: "0 0"
}

/* footer */
const footerNote = {
  height: 36,
  marginTop: 14,
  display: "flex",
  alignItems: "center",
  gap: 10,
  paddingLeft: 6,
  fontSize: 12,
  color: "rgba(0,0,0,0.45)",
  fontWeight: 900
}

const greenDot = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "rgba(20,92,67,0.9)",
  boxShadow: "0 10px 18px rgba(16,185,129,0.22)"
}

/* =========== RESPONSIVE =========== */
if (typeof window !== "undefined") {
  const mq = window.matchMedia("(max-width: 920px)")
  if (mq.matches) {
    content.gridTemplateColumns = "1fr"
    side.display = "none"
    main.padding = 14
  }
}
