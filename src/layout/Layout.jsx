import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  // En pantallas chicas arrancamos colapsado (iPad / laptops chicas)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1100px)")
    const apply = () => setCollapsed(mq.matches)
    apply()
    mq.addEventListener?.("change", apply)
    return () => mq.removeEventListener?.("change", apply)
  }, [])

  return (
    <div style={app}>
      {/* Sidebar ocupa espacio REAL */}
      <div style={{ ...sidebarCol, width: collapsed ? 92 : 300 }}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((s) => !s)} />
      </div>

      {/* Content centrado */}
      <div style={contentCol}>
        <div style={topbar}>
          <button
            type="button"
            onClick={() => setCollapsed((s) => !s)}
            style={iconBtn}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            {collapsed ? "☰" : "⟨"}
          </button>

          <div style={topbarRight}>
            <span style={topHint}>PsicoFunnel CRM</span>
          </div>
        </div>

        <div style={scrollArea}>
          <div style={pageWrap}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

/* =====================
   STYLES
===================== */

const app = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

/* Columna sidebar */
const sidebarCol = {
  height: "100vh",
  flex: "0 0 auto"
}

/* Columna contenido */
const contentCol = {
  flex: 1,
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
}

const topbar = {
  height: 58,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 18px",
  borderBottom: "1px solid var(--line)",
  background: "rgba(10,14,13,0.55)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)"
}

const topbarRight = {
  display: "flex",
  alignItems: "center",
  gap: 12
}

const topHint = {
  fontSize: 12,
  fontWeight: 800,
  color: "var(--muted)"
}

const iconBtn = {
  width: 38,
  height: 38,
  borderRadius: 12,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--text)",
  cursor: "pointer",
  fontWeight: 900,
  lineHeight: "38px",
  textAlign: "center",
  boxShadow: "0 10px 26px rgba(0,0,0,0.25)"
}

const scrollArea = {
  flex: 1,
  overflow: "auto",
  padding: "26px 26px 34px"
}

/* Centro real (esto es lo que te faltaba) */
const pageWrap = {
  maxWidth: 1280,
  width: "100%",
  margin: "0 auto"
}
