import { Link, useLocation } from "react-router-dom"
import { useMemo } from "react"

export default function Sidebar({ isMobile, open, onToggle, onClose, onOpen }) {
  const location = useLocation()

  // ✅ sin emojis (más premium)
  const links = [
    { path: "/dashboard", label: "Overview", icon: "Overview" },
    { path: "/companies", label: "Companies", icon: "Companies" },
    { path: "/leads", label: "Leads", icon: "Leads" },
    { path: "/pipeline", label: "Pipeline", icon: "Pipeline" },
    { path: "/calendar", label: "Calendar", icon: "Calendar" }
  ]

  // En desktop: open=true => grande, open=false => colapsada
  const isCollapsedDesktop = !isMobile && !open

  const wrapperStyle = useMemo(() => {
    if (isMobile) {
      return {
        ...sidebarWrapperMobile,
        transform: open ? "translateX(0)" : "translateX(-112%)"
      }
    }
    return {
      ...sidebarWrapper,
      width: isCollapsedDesktop ? "110px" : "300px"
    }
  }, [isMobile, open, isCollapsedDesktop])

  const panelStyle = useMemo(() => {
    if (isMobile) return sidebarMobile

    return {
      ...sidebar,
      width: isCollapsedDesktop ? "86px" : "260px",
      padding: isCollapsedDesktop ? "22px 12px" : "34px 22px"
    }
  }, [isMobile, isCollapsedDesktop])

  return (
    <>
      {/* Overlay (solo mobile cuando está abierto) */}
      {isMobile && open ? <div style={overlay} onClick={onClose} aria-hidden="true" /> : null}

      <div style={wrapperStyle}>
        <div style={panelStyle}>
          <div style={topRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={brandMark} />
              {!isCollapsedDesktop ? (
                <div style={{ minWidth: 0 }}>
                  <div style={logo}>PsicoFunnel</div>
                  <div style={logoSub}>CRM</div>
                </div>
              ) : null}
            </div>

            {/* Botón control: desktop colapsa/expande, mobile cierra */}
            {isMobile ? (
              <button type="button" style={iconBtn} onClick={onClose} aria-label="Close menu">
                <span style={btnGlyph}>×</span>
              </button>
            ) : (
              <button
                type="button"
                style={iconBtn}
                onClick={() => (isCollapsedDesktop ? onOpen?.() : onToggle?.())}
                aria-label="Toggle sidebar"
                title={isCollapsedDesktop ? "Expand" : "Collapse"}
              >
                <span style={btnGlyph}>{isCollapsedDesktop ? "→" : "←"}</span>
              </button>
            )}
          </div>

          <div style={{ marginTop: isCollapsedDesktop ? 18 : 38 }}>
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
                    ...(active ? itemActive : null)
                  }}
                >
                  {/* icon minimal: inicial en chip */}
                  <span style={{ ...itemIcon, ...(active ? itemIconActive : null) }}>
                    {link.label.slice(0, 1)}
                  </span>

                  {!isCollapsedDesktop ? <span style={itemLabel}>{link.label}</span> : null}

                  {!isCollapsedDesktop ? (
                    <span style={{ ...activeDot, opacity: active ? 1 : 0 }} />
                  ) : null}
                </Link>
              )
            })}
          </div>

          {!isCollapsedDesktop ? (
            <div style={footerHint}>
              <div style={hintTitle}>Workspace</div>
              <div style={hintText}>Colapsá el menú para trabajar más cómodo en iPad.</div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

/* ===================== STYLES ===================== */

const FONT = "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"

const sidebarWrapper = {
  padding: "34px 18px",
  display: "flex",
  justifyContent: "center",
  transition: "width 0.22s ease"
}

const sidebarWrapperMobile = {
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  width: "320px",
  padding: "16px 14px",
  display: "flex",
  justifyContent: "flex-start",
  zIndex: 60,
  transition: "transform 0.22s ease"
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.28)",
  backdropFilter: "blur(3px)",
  WebkitBackdropFilter: "blur(3px)",
  zIndex: 55
}

const sidebar = {
  height: "100%",
  borderRadius: "26px",
  background: "rgba(255,255,255,0.56)",
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
  border: "1px solid rgba(15,61,46,0.10)",
  boxShadow: `
    0 26px 60px rgba(15,61,46,0.14),
    inset 0 1px 0 rgba(255,255,255,0.65)
  `,
  transition: "width 0.22s ease, padding 0.22s ease",
  display: "flex",
  flexDirection: "column",
  fontFamily: FONT
}

const sidebarMobile = {
  ...sidebar,
  width: "100%",
  padding: "26px 18px"
}

const topRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12
}

const brandMark = {
  width: 12,
  height: 12,
  borderRadius: 999,
  background: "linear-gradient(135deg,#145c43,#1e7a57)",
  boxShadow: "0 10px 18px rgba(20,92,67,0.26)"
}

const logo = {
  fontSize: 16,
  fontWeight: 950,
  color: "#0f3d2e",
  letterSpacing: 0.2,
  lineHeight: 1.1
}

const logoSub = {
  marginTop: 2,
  fontSize: 11,
  fontWeight: 850,
  color: "rgba(0,0,0,0.45)"
}

const iconBtn = {
  width: 40,
  height: 40,
  borderRadius: 14,
  border: "1px solid rgba(15,61,46,0.12)",
  background: "rgba(255,255,255,0.70)",
  boxShadow: "0 10px 22px rgba(15,61,46,0.08)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center"
}

const btnGlyph = {
  fontWeight: 950,
  color: "#0f3d2e",
  lineHeight: 1
}

const item = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 12px",
  marginBottom: "10px",
  borderRadius: "16px",
  textDecoration: "none",
  transition: "transform 0.12s ease, background 0.12s ease, border-color 0.12s ease",
  border: "1px solid transparent"
}

const itemCollapsed = {
  justifyContent: "center",
  padding: "12px 10px"
}

const itemActive = {
  background: "rgba(20,92,67,0.10)",
  borderColor: "rgba(20,92,67,0.16)"
}

const itemIcon = {
  width: 28,
  height: 28,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  fontSize: 12,
  fontWeight: 950,
  color: "rgba(0,0,0,0.60)",
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(0,0,0,0.06)"
}

const itemIconActive = {
  color: "#145c43",
  borderColor: "rgba(20,92,67,0.16)",
  background: "rgba(255,255,255,0.80)"
}

const itemLabel = {
  fontSize: 13,
  fontWeight: 900,
  color: "#0f3d2e",
  letterSpacing: 0.1
}

const activeDot = {
  marginLeft: "auto",
  width: 7,
  height: 7,
  borderRadius: 999,
  background: "linear-gradient(135deg,#145c43,#1e7a57)",
  boxShadow: "0 10px 16px rgba(20,92,67,0.20)",
  transition: "opacity 0.15s ease"
}

const footerHint = {
  marginTop: "auto",
  paddingTop: 16,
  borderTop: "1px solid rgba(15,61,46,0.10)"
}

const hintTitle = {
  fontSize: 11,
  fontWeight: 950,
  color: "rgba(20,92,67,0.95)",
  letterSpacing: 0.3,
  textTransform: "uppercase",
  marginBottom: 6
}

const hintText = {
  fontSize: 12,
  color: "rgba(0,0,0,0.55)",
  lineHeight: 1.35,
  fontWeight: 750
}
