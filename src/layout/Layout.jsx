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

  const contentStyle = useMemo(() => {
    return {
      ...content,
      padding: isMobile ? "92px 16px 22px" : "96px 26px 26px"
    }
  }, [isMobile])

  return (
    <div style={app}>
      {/* Background layers (precisos, suaves, NO plástico) */}
      <div aria-hidden="true" style={bgLayerA} />
      <div aria-hidden="true" style={bgLayerB} />

      <Sidebar
        isMobile={isMobile}
        open={menuOpen}
        onOpen={() => setMenuOpen(true)}
        onClose={() => setMenuOpen(false)}
        onToggle={() => setMenuOpen((v) => !v)}
      />

      <main style={contentStyle}>{children}</main>
    </div>
  )
}

const app = {
  position: "relative",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif",
  background: "#f4fbf8",
  color: "#0f3d2e"
}

/* Fondo clean con difuminados precisos */
const bgLayerA = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background: `
    radial-gradient(900px 520px at 16% 12%, rgba(20,92,67,0.14), transparent 58%),
    radial-gradient(900px 520px at 84% 82%, rgba(15,61,46,0.10), transparent 60%),
    linear-gradient(180deg, #f6fcf9 0%, #eef7f1 100%)
  `
}

const bgLayerB = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(700px 420px at 55% 10%, rgba(31,174,122,0.06), transparent 62%)",
  filter: "blur(10px)",
  opacity: 0.9
}

const content = {
  position: "relative",
  height: "100%",
  overflowY: "auto",
  overflowX: "hidden"
}
