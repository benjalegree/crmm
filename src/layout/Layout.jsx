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

  const sidebarWidth = collapsed ? 92 : 300

  return (
    <div style={app}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((s) => !s)} />

      <div style={{ ...content, paddingLeft: 0 }}>
        {/* Top bar sutil (solo para toggle y aire visual) */}
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

        <div style={{ ...inner, paddingLeft: 0, marginLeft: 0 }}>
          <div style={{ ...stage, marginLeft: 0, width: "100%" }}>
            {/* Contenedor principal con margen calculado */}
            <div style={{ ...pageWrap, marginLeft: 0, paddingLeft: 0 }}>
              <div style={{ ...pageInner, paddingLeft: 0 }}>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layer “layout”: sidebar + contenido con ancho real */}
      <style>{`
        /* Este style inline es solo para ajustar el ancho sin reflow raro */
      `}</style>

      <div style={{ ...sidebarSpacer, width: sidebarWidth }} />
    </div>
  )
}

/* =====================
   STYLES
===================== */

const app = {
  position: "relative",
  zIndex: 1, // encima del fondo
  display: "flex",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

// “spacer” invisible para reservar el espacio real del sidebar
const sidebarSpacer = {
  position: "fixed",
  left: 0,
  top: 0,
  height: "100vh",
  pointerEvents: "none",
  opacity: 0
}

const content = {
  flex: 1,
  width: "100%",
  height: "100%",
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

const inner = {
  height: "calc(100vh - 58px)",
  overflow: "auto"
}

const stage = {
  padding: "26px 26px 34px"
}

// Mantiene el “feel” Apple (aire) sin agrandar nada
const pageWrap = {
  maxWidth: 1280,
  margin: "0 auto"
}

const pageInner = {
  width: "100%"
}
