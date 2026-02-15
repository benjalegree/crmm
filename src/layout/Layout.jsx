import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 1024
      setIsMobile(mobile)
      setMenuOpen(false)
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const contentPad = useMemo(() => (isMobile ? 16 : 22), [isMobile])

  return (
    <div style={app}>
      {/* Fondo: verde inglés NOTORIO, con difuminados precisos */}
      <div aria-hidden="true" style={bg} />
      <div aria-hidden="true" style={bgVignette} />
      <div aria-hidden="true" style={bgNoise} />

      {/* Topbar pill (no sidebar burbuja) */}
      <Sidebar
        isMobile={isMobile}
        open={menuOpen}
        onOpen={() => setMenuOpen(true)}
        onClose={() => setMenuOpen(false)}
        onToggle={() => setMenuOpen((v) => !v)}
      />

      {/* Content full screen */}
      <main style={{ ...content, padding: `${92}px ${contentPad}px ${contentPad}px` }}>
        {children}
      </main>
    </div>
  )
}

/* ================= TOKENS ================= */

const FONT = "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"

/* Verde inglés notorio pero elegante */
const app = {
  position: "relative",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  fontFamily: FONT,
  color: "#0f3d2e",
  background: "#0b2a20" // base profunda (verde inglés)
}

/* Fondo con difuminados “premium” (sin plástico) */
const bg = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background: `
    radial-gradient(1200px 650px at 18% 18%, rgba(43,218,154,0.26), transparent 60%),
    radial-gradient(1100px 700px at 78% 30%, rgba(31,174,122,0.20), transparent 62%),
    radial-gradient(900px 600px at 60% 92%, rgba(20,92,67,0.26), transparent 60%),
    linear-gradient(180deg, rgba(10,35,27,1) 0%, rgba(10,45,34,1) 45%, rgba(11,42,32,1) 100%)
  `
}

/* viñeta suave para look “device / estudio” */
const bgVignette = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(1200px 800px at 50% 30%, rgba(255,255,255,0.06), transparent 62%)",
  opacity: 0.9
}

/* ruido MUY leve para evitar look plástico */
const bgNoise = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.06,
  mixBlendMode: "overlay",
  backgroundImage: `
    repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, transparent 1px, transparent 3px),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)
  `
}

/* Content: scroll vertical, sin overflow horizontal */
const content = {
  position: "relative",
  height: "100%",
  width: "100%",
  overflowY: "auto",
  overflowX: "hidden",
  boxSizing: "border-box"
}
