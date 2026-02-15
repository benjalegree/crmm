import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"

const T = {
  ink: "#0B241C",
  line: "rgba(11,36,28,0.12)",
  line2: "rgba(255,255,255,0.22)",
  // Fondo premium “raro”
  bg0: "#061A14",
  bg1: "#0B241C",
  bg2: "#103226",
  aur1: "rgba(20,92,67,0.55)",
  aur2: "rgba(13,61,46,0.45)",
  aur3: "rgba(34,160,110,0.22)",

  // Topbar glass
  topbar: "rgba(255,255,255,0.12)",
  topbar2: "rgba(255,255,255,0.08)",

  // Sombras premium suaves
  shadow: "0 20px 60px rgba(0,0,0,0.28)",
  shadowSoft: "0 10px 30px rgba(0,0,0,0.18)"
}

export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 1024
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const contentStyle = useMemo(() => {
    return {
      ...content,
      padding: isMobile ? "86px 16px 22px" : "30px 38px"
    }
  }, [isMobile])

  return (
    <div style={app}>
      {/* Grain overlay global */}
      <div aria-hidden="true" style={grain} />
      {/* Glow/aurora overlay */}
      <div aria-hidden="true" style={aurora} />

      <Sidebar
        isMobile={isMobile}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />

      {isMobile ? (
        <div style={mobileTopbar}>
          <button
            type="button"
            style={burgerBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div style={topbarTitle}>PsicoFunnel CRM</div>
          <div style={{ width: 44 }} />
        </div>
      ) : null}

      <div style={contentStyle}>{children}</div>
    </div>
  )
}

const app = {
  position: "relative",
  display: "flex",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif",
  color: "rgba(255,255,255,0.92)",
  background: `
    radial-gradient(1000px 700px at 10% 8%, rgba(34,160,110,0.20), transparent 55%),
    radial-gradient(900px 700px at 90% 85%, rgba(20,92,67,0.26), transparent 55%),
    radial-gradient(700px 520px at 65% 35%, rgba(10,40,32,0.75), transparent 65%),
    linear-gradient(180deg, ${T.bg0} 0%, ${T.bg1} 45%, ${T.bg2} 100%)
  `
}

const aurora = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background: `
    radial-gradient(900px 520px at 22% 18%, rgba(20,92,67,0.28), transparent 60%),
    radial-gradient(900px 520px at 75% 70%, rgba(13,61,46,0.26), transparent 60%),
    conic-gradient(from 220deg at 55% 35%, rgba(34,160,110,0.10), transparent 40%, rgba(20,92,67,0.10), transparent 75%)
  `,
  filter: "blur(18px)",
  opacity: 0.9,
  mixBlendMode: "screen"
}

/* Grain real (sin assets). Sutilísimo para que se sienta premium */
const grain = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.12,
  backgroundImage: `
    repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 3px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.018) 0, rgba(0,0,0,0.018) 1px, transparent 1px, transparent 3px)
  `,
  mixBlendMode: "overlay"
}

const content = {
  position: "relative",
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  color: "rgba(255,255,255,0.92)"
}

const mobileTopbar = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: 64,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 12px",
  zIndex: 50,
  borderBottom: "1px solid rgba(255,255,255,0.10)",
  background: `
    linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))
  `,
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.20)"
}

const burgerBtn = {
  width: 44,
  height: 44,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.10)",
  boxShadow: "0 12px 26px rgba(0,0,0,0.22)",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 18,
  color: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)"
}

const topbarTitle = {
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: 0.25,
  color: "rgba(255,255,255,0.92)"
}
