import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // En pantallas chicas arrancamos cerrado para dar espacio (iPad incluido)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)")
    const apply = () => setSidebarOpen(!mq.matches)
    apply()
    mq.addEventListener?.("change", apply)
    return () => mq.removeEventListener?.("change", apply)
  }, [])

  return (
    <div style={app}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((s) => !s)} />

      <div
        style={{
          ...content,
          paddingLeft: sidebarOpen ? 28 : 18
        }}
      >
        {/* Top bar minimal para toggle también en desktop */}
        <div style={topBar}>
          <button
            type="button"
            onClick={() => setSidebarOpen((s) => !s)}
            style={iconBtn}
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {sidebarOpen ? "⟨" : "⟩"}
          </button>

          <div style={topHint}>CRM</div>
        </div>

        <div style={pageWrap}>{children}</div>
      </div>
    </div>
  )
}

const app = {
  display: "flex",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif",
  background: `
    radial-gradient(circle at 10% 10%, rgba(30,122,87,0.12), transparent 40%),
    radial-gradient(circle at 90% 90%, rgba(15,61,46,0.12), transparent 40%),
    linear-gradient(135deg, #f7fbf9 0%, #eef7f2 50%, #f7fbf9 100%)
  `
}

const content = {
  flex: 1,
  overflowY: "auto",
  padding: "22px 28px",
  transition: "padding 220ms ease"
}

const topBar = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  position: "sticky",
  top: 0,
  zIndex: 20,
  padding: "10px 0 14px 0",
  background: "transparent"
}

const iconBtn = {
  width: 36,
  height: 32,
  borderRadius: 12, // ✅ sutil
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  fontWeight: 800,
  cursor: "pointer",
  color: "rgba(0,0,0,0.70)",
  lineHeight: "32px"
}

const topHint = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "rgba(0,0,0,0.45)"
}

const pageWrap = {
  maxWidth: 1200,
  margin: "0 auto",
  paddingBottom: 22
}
