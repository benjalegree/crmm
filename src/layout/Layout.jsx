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

  const pagePad = useMemo(() => (isMobile ? 16 : 22), [isMobile])

  return (
    <div style={app}>
      {/* Fondo (verde inglés) — difuminados suaves, precisos */}
      <div aria-hidden="true" style={bg} />
      <div aria-hidden="true" style={bgSoftNoise} />

      {/* Stage central (el truco #1 de tus refs) */}
      <div style={{ ...stageWrap, padding: pagePad }}>
        <div style={stageFrame}>
          <div aria-hidden="true" style={stageInnerStroke} />
          <div aria-hidden="true" style={stageGlow} />

          {/* Topbar pill interna */}
          <Sidebar
            isMobile={isMobile}
            open={menuOpen}
            onOpen={() => setMenuOpen(true)}
            onClose={() => setMenuOpen(false)}
            onToggle={() => setMenuOpen((v) => !v)}
          />

          {/* Content */}
          <main style={content}>{children}</main>
        </div>
      </div>
    </div>
  )
}

/* ================= TOKENS ================= */

const FONT = "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"

const C = {
  bg1: "#f3fbf7",
  bg2: "#eaf6ef",
  ink: "#0f3d2e",
  ink2: "rgba(15,61,46,0.68)",
  ink3: "rgba(15,61,46,0.52)",
  stroke: "rgba(15,61,46,0.10)",
  strokeSoft: "rgba(255,255,255,0.55)",
  glassA: "rgba(255,255,255,0.66)",
  glassB: "rgba(255,255,255,0.46)",
  shadow: "0 24px 70px rgba(15,61,46,0.14)",
  shadowSoft: "0 18px 50px rgba(0,0,0,0.10)",
  highlightInset: "inset 0 1px 0 rgba(255,255,255,0.60)"
}

/* ================= LAYOUT ================= */

const app = {
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  position: "relative",
  fontFamily: FONT,
  background: C.bg1,
  color: C.ink
}

const bg = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background: `
    radial-gradient(900px 560px at 18% 12%, rgba(20,92,67,0.16), transparent 60%),
    radial-gradient(900px 560px at 84% 86%, rgba(15,61,46,0.12), transparent 62%),
    radial-gradient(760px 460px at 52% 8%, rgba(31,174,122,0.07), transparent 60%),
    linear-gradient(180deg, ${C.bg1} 0%, ${C.bg2} 100%)
  `
}

/* ruido sutil para que NO se vea plástico */
const bgSoftNoise = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.06,
  mixBlendMode: "multiply",
  backgroundImage: `
    repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, transparent 1px, transparent 3px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)
  `
}

/* centra el stage */
const stageWrap = {
  position: "relative",
  height: "100%",
  width: "100%",
  display: "grid",
  placeItems: "center"
}

/* stage frame grande como tus refs */
const stageFrame = {
  position: "relative",
  width: "min(1280px, 100%)",
  height: "min(740px, 100%)",
  borderRadius: 28,
  background: `
    linear-gradient(180deg, rgba(255,255,255,0.30), rgba(255,255,255,0.16))
  `,
  border: `1px solid ${C.stroke}`,
  boxShadow: C.shadow,
  overflow: "hidden"
}

/* borde interno suave (doble borde como refs) */
const stageInnerStroke = {
  position: "absolute",
  inset: 10,
  borderRadius: 22,
  border: `1px solid ${C.strokeSoft}`,
  pointerEvents: "none",
  opacity: 0.85
}

/* glow exterior muy sutil */
const stageGlow = {
  position: "absolute",
  inset: -60,
  background:
    "radial-gradient(800px 400px at 50% 15%, rgba(31,174,122,0.14), transparent 60%)",
  filter: "blur(18px)",
  opacity: 0.55,
  pointerEvents: "none"
}

/* content scroll interno, sin overflow lateral */
const content = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 88, // deja lugar para topbar pill
  bottom: 0,
  padding: "18px 18px 18px",
  overflowY: "auto",
  overflowX: "hidden"
}
