import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 1024 // iPad y abajo
      setIsMobile(mobile)
      setSidebarOpen(!mobile) // mobile cerrado, desktop abierto
    }

    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const contentStyle = useMemo(() => {
    return {
      ...content,
      padding: isMobile ? "92px 16px 24px" : "56px 72px"
    }
  }, [isMobile])

  return (
    <div style={app}>
      <Sidebar
        isMobile={isMobile}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />

      {/* Topbar solo en mobile */}
      {isMobile ? (
        <div style={mobileTopbar}>
          <button
            type="button"
            style={iconBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            title="Menu"
          >
            {/* icon simple */}
            <span style={iconGlyph}>≡</span>
          </button>

          <div style={topbarCenter}>
            <div style={topbarTitle}>PsicoFunnel CRM</div>
            <div style={topbarSub}>Overview</div>
          </div>

          <div style={{ width: 44 }} />
        </div>
      ) : null}

      <div style={contentStyle}>{children}</div>
    </div>
  )
}

/* ===================== STYLES ===================== */

const FONT = "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"

const app = {
  position: "relative",
  display: "flex",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  fontFamily: FONT,
  color: "#0f3d2e",
  background: `
    radial-gradient(circle at 12% 10%, rgba(30,122,87,0.14), transparent 42%),
    radial-gradient(circle at 88% 84%, rgba(15,61,46,0.10), transparent 44%),
    linear-gradient(180deg, #fbfdfc 0%, #f2faf6 55%, #fbfdfc 100%)
  `
}

const content = {
  flex: 1,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch"
}

const mobileTopbar = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: 72,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 14px",
  zIndex: 50,
  background: "rgba(251,253,252,0.72)",
  backdropFilter: "blur(26px)",
  WebkitBackdropFilter: "blur(26px)",
  borderBottom: "1px solid rgba(15,61,46,0.08)"
}

const topbarCenter = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2
}

const topbarTitle = {
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: 0.2,
  color: "#0f3d2e"
}

const topbarSub = {
  fontSize: 11,
  fontWeight: 800,
  color: "rgba(0,0,0,0.45)"
}

const iconBtn = {
  width: 44,
  height: 44,
  borderRadius: 14,
  border: "1px solid rgba(15,61,46,0.10)",
  background: "rgba(255,255,255,0.80)",
  boxShadow: "0 10px 22px rgba(15,61,46,0.08)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  transition: "transform 0.15s ease, box-shadow 0.15s ease"
}

const iconGlyph = {
  fontSize: 18,
  fontWeight: 900,
  color: "#0f3d2e",
  lineHeight: 1
}
