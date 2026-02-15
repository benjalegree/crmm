import { Link, useLocation } from "react-router-dom"
import { useMemo } from "react"

export default function Sidebar({ isMobile, open, onToggle, onClose, onOpen }) {
  const location = useLocation()

  const links = [
    { path: "/dashboard", label: "Overview", icon: "🏠" },
    { path: "/companies", label: "Companies", icon: "🏢" },
    { path: "/leads", label: "Leads", icon: "👤" },
    { path: "/pipeline", label: "Pipeline", icon: "📌" },
    { path: "/calendar", label: "Calendar", icon: "🗓️" }
  ]

  // En desktop: open=true => grande, open=false => colapsada
  const isCollapsedDesktop = !isMobile && !open

  const wrapperStyle = useMemo(() => {
    if (isMobile) {
      // Mobile: drawer overlay
      return {
        ...sidebarWrapperMobile,
        transform: open ? "translateX(0)" : "translateX(-110%)"
      }
    }

    // Desktop: ancho del wrapper depende de colapsado
    return {
      ...sidebarWrapper,
      width: isCollapsedDesktop ? "120px" : "300px"
    }
  }, [isMobile, open, isCollapsedDesktop])

  const panelStyle = useMemo(() => {
    if (isMobile) return sidebarMobile

    return {
      ...sidebar,
      width: isCollapsedDesktop ? "96px" : "260px",
      padding: isCollapsedDesktop ? "26px 14px" : "40px 25px"
    }
  }, [isMobile, isCollapsedDesktop])

  return (
    <>
      {/* Overlay (solo mobile cuando está abierto) */}
      {isMobile && open ? <div style={overlay} onClick={onClose} aria-hidden="true" /> : null}

      <div style={wrapperStyle}>
        <div style={panelStyle}>
          <div style={topRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={brandDot} />
              {!isCollapsedDesktop ? <div style={logo}>PsicoFunnel</div> : null}
            </div>

            {/* Botón control: desktop colapsa/expande, mobile cierra */}
            {isMobile ? (
              <button type="button" style={iconBtn} onClick={onClose} aria-label="Close menu">
                ✕
              </button>
            ) : (
              <button
                type="button"
                style={iconBtn}
                onClick={() => (isCollapsedDesktop ? onOpen?.() : onToggle?.())}
                aria-label="Toggle sidebar"
                title={isCollapsedDesktop ? "Expand" : "Collapse"}
              >
                {isCollapsedDesktop ? "→" : "←"}
              </button>
            )}
          </div>

          <div style={{ marginTop: isCollapsedDesktop ? 22 : 50 }}>
            {links.map((link) => {
              const active = location.pathname === link.path

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => {
                    if (isMobile) onClose?.()
                  }}
                  style={{
                    ...item,
                    ...(isCollapsedDesktop ? itemCollapsed : {}),
                    background: active
                      ? "linear-gradient(135deg,#145c43,#1e7a57)"
                      : "transparent",
                    color: active ? "#ffffff" : "#0f3d2e",
                    boxShadow: active ? "0 12px 30px rgba(20,92,67,0.4)" : "none"
                  }}
                >
                  <span style={itemIcon}>{link.icon}</span>
                  {!isCollapsedDesktop ? <span>{link.label}</span> : null}
                </Link>
              )
            })}
          </div>

          {!isCollapsedDesktop ? (
            <div style={footerHint}>
              <div style={hintTitle}>Tip</div>
              <div style={hintText}>Podés colapsar el menú para ganar más espacio.</div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

const sidebarWrapper = {
  padding: "40px 20px",
  display: "flex",
  justifyContent: "center",
  transition: "width 0.25s ease"
}

const sidebarWrapperMobile = {
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  width: "320px",
  padding: "18px 14px",
  display: "flex",
  justifyContent: "flex-start",
  zIndex: 60,
  transition: "transform 0.25s ease"
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.28)",
  backdropFilter: "blur(2px)",
  WebkitBackdropFilter: "blur(2px)",
  zIndex: 55
}

const sidebar = {
  height: "100%",
  borderRadius: "32px",
  background: "rgba(255,255,255,0.4)",
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: `
    0 30px 60px rgba(15,61,46,0.15),
    inset 0 1px 0 rgba(255,255,255,0.6)
  `,
  transition: "width 0.25s ease, padding 0.25s ease"
}

const sidebarMobile = {
  ...sidebar,
  width: "100%",
  padding: "28px 20px"
}

const topRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between"
}

const brandDot = {
  width: 12,
  height: 12,
  borderRadius: 999,
  background: "linear-gradient(135deg,#145c43,#1e7a57)",
  boxShadow: "0 10px 20px rgba(20,92,67,0.28)"
}

const logo = {
  fontSize: "20px",
  fontWeight: "800",
  color: "#0f3d2e",
  letterSpacing: 0.2
}

const iconBtn = {
  width: 40,
  height: 40,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.75)",
  boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
  cursor: "pointer",
  fontWeight: 900
}

const item = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "14px 18px",
  marginBottom: "14px",
  borderRadius: "18px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "700",
  transition: "all 0.25s ease"
}

const itemCollapsed = {
  justifyContent: "center",
  padding: "14px 12px"
}

const itemIcon = {
  width: 26,
  display: "grid",
  placeItems: "center",
  fontSize: 16
}

const footerHint = {
  marginTop: "auto",
  paddingTop: 18,
  borderTop: "1px solid rgba(0,0,0,0.06)"
}

const hintTitle = {
  fontSize: 12,
  fontWeight: 900,
  color: "#145c43",
  marginBottom: 6
}

const hintText = {
  fontSize: 12,
  color: "rgba(0,0,0,0.55)",
  lineHeight: 1.35
}
