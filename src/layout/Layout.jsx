import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 1024
      setIsMobile(mobile)
      setSidebarOpen(!mobile) // desktop abierto, mobile cerrado
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const shellStyle = useMemo(() => {
    return {
      ...shell,
      padding: isMobile ? 14 : 18
    }
  }, [isMobile])

  return (
    <div style={app}>
      {/* Fondo soft azul/gris como la referencia */}
      <div aria-hidden="true" style={bg} />
      <div aria-hidden="true" style={bgGlow} />
      <div aria-hidden="true" style={bgNoise} />

      <div style={shellStyle}>
        <Sidebar
          isMobile={isMobile}
          open={sidebarOpen}
          onOpen={() => setSidebarOpen(true)}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen((v) => !v)}
        />

        <main
          style={{
            ...main,
            marginLeft: isMobile ? 0 : sidebarOpen ? 280 : 96
          }}
        >
          <div style={contentCard}>{children}</div>
        </main>
      </div>
    </div>
  )
}

/* ================= TOKENS ================= */

const FONT = "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"

const app = {
  position: "relative",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  fontFamily: FONT,
  color: "#0f172a"
}

const bg = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background: `
    radial-gradient(900px 600px at 22% 18%, rgba(96,165,250,0.35), transparent 60%),
    radial-gradient(900px 650px at 78% 22%, rgba(148,163,184,0.35), transparent 62%),
    radial-gradient(900px 650px at 52% 88%, rgba(59,130,246,0.18), transparent 60%),
    linear-gradient(180deg, #cbd5e1 0%, #dbeafe 30%, #e5e7eb 100%)
  `
}

const bgGlow = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background: "radial-gradient(700px 380px at 50% 6%, rgba(255,255,255,0.55), transparent 65%)",
  opacity: 0.95
}

/* ruido sutil para que no quede “plástico” */
const bgNoise = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.06,
  mixBlendMode: "multiply",
  backgroundImage: `
    repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)
  `
}

const shell = {
  position: "relative",
  height: "100%",
  width: "100%",
  boxSizing: "border-box"
}

/* main ocupa el resto del viewport */
const main = {
  position: "absolute",
  top: 18,
  right: 18,
  bottom: 18,
  left: 18,
  transition: "margin-left 180ms ease",
  overflow: "hidden"
}

/* el “panel” grande claro donde vive el contenido, como en la ref */
const contentCard = {
  height: "100%",
  width: "100%",
  borderRadius: 28,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(15,23,42,0.08)",
  boxShadow: "0 24px 80px rgba(15,23,42,0.16), inset 0 1px 0 rgba(255,255,255,0.70)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  overflow: "hidden"
}
