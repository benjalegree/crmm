import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 1024 // iPad y abajo
      setIsMobile(mobile)
      // si cambia el modo, definimos default cómodo
      setSidebarOpen(!mobile) // mobile cerrado, desktop abierto
    }

    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const contentStyle = useMemo(() => {
    return {
      ...content,
      // topbar en mobile ocupa 64px
      padding: isMobile ? "88px 18px 24px" : "60px 80px"
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
  background: `
    radial-gradient(circle at 10% 10%, rgba(30,122,87,0.18), transparent 40%),
    radial-gradient(circle at 90% 90%, rgba(15,61,46,0.18), transparent 40%),
    linear-gradient(135deg, #f4fbf8 0%, #e9f6f0 50%, #f4fbf8 100%)
  `
}

const content = {
  flex: 1,
  overflowY: "auto"
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
  padding: "0 14px",
  zIndex: 50,
  background: "rgba(244,251,248,0.75)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  borderBottom: "1px solid rgba(0,0,0,0.06)"
}

const burgerBtn = {
  width: 44,
  height: 44,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.85)",
  boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 18
}

const topbarTitle = {
  fontSize: 14,
  fontWeight: 900,
  color: "#0f3d2e",
  letterSpacing: 0.2
}
