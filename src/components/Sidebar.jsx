import { Link, useLocation } from "react-router-dom"
import { useMemo } from "react"

const T = {
  bg: "#F6FBF8",
  bg2: "#EEF6F1",
  ink: "#0F2E24",
  ink2: "rgba(15,46,36,0.72)",
  ink3: "rgba(15,46,36,0.52)",
  line: "rgba(15,46,36,0.10)",
  line2: "rgba(15,46,36,0.14)",
  surface: "rgba(255,255,255,0.72)",
  surface2: "rgba(255,255,255,0.56)",
  accent: "#145C43", // verde inglés
  accent2: "#0F3D2E",
  accentSoft: "rgba(20,92,67,0.12)",
  accentSoft2: "rgba(20,92,67,0.18)",
  shadow: "0 18px 40px rgba(15,46,36,0.10)",
  shadow2: "0 10px 24px rgba(15,46,36,0.08)"
}

export default function Sidebar({ isMobile, open, onToggle, onClose, onOpen }) {
  const location = useLocation()

  const links = [
    { path: "/dashboard", label: "Overview", icon: "🏠" },
    { path: "/companies", label: "Companies", icon: "🏢" },
    { path: "/leads", label: "Leads", icon: "👤" },
    { path: "/pipeline", label: "Pipeline", icon: "📌" },
    { path: "/calendar", label: "Calendar", icon: "🗓️" }
  ]

  // Desktop: open=true expandida, open=false colapsada
  const isCollapsedDesktop = !isMobile && !open

  const wrapperStyle = useMemo(() => {
    if (isMobile) {
      return {
        ...sidebarWrapperMobile,
        transform: open ? "translateX(0)" : "translateX(-110%)"
      }
    }

    return {
      ...sidebarWrapper,
      width: isCollapsedDesktop ? "112px" : "272px"
    }
  }, [isMobile, open, isCollapsedDesktop])

  const panelStyle = useMemo(() => {
    if (isMobile) return sidebarMobile

    return {
      ...sidebar,
      width: isCollapsedDesktop ? "88px" : "248px",
      padding: isCollapsedDesktop ? "18px 10px" : "20px 14px"
    }
  }, [isMobile, isCollapsedDesktop])

  return (
    <>
      {/* Overlay solo en mobile */}
      {isMobile && open ? <div style={overlay} onClick={onClose} aria-hidden="true" /> : null}

      <div style={wrapperStyle}>
        <div style={panelStyle}>
          <div style={topRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={brandMark}>
                <span style={brandDot} />
              </div>

              {!isCollapsedDesktop ? (
                <div style={logoWrap}>
                  <div style={logo}>PsicoFunnel</div>
                  <div style={logoSub}>CRM</div>
                </div>
              ) : null}
            </div>

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

          <div style={{ marginTop: isCollapsedDesktop ? 16 : 18 }}>
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
                    ...(active ? itemActive : {}),
                    color: active ? T.ink : T.ink2
                  }}
                >
                  <span style={{ ...itemIcon, ...(active ? itemIconActive : {}) }}>{link.icon}</span>
                  {!isCollapsedDesktop ? (
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {link.label}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>

          {!isCollapsedDesktop ? (
            <div style={footerHint}>
              <div style={hintTitle}>Tip</div>
              <div style={hintText}>Colapsá el menú para ganar espacio y mover más leads cómodo.</div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

/* ============ STYLES ============ */

const sidebarWrapper = {
  padding: "18px 14px",
  display: "flex",
  justifyContent: "center",
  transition: "width 220ms ease"
}

const sidebarWrapperMobile = {
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  width: "320px",
  padding: "14px 12px",
  display: "flex",
  justifyContent: "flex-start",
  zIndex: 60,
  transition: "transform 220ms ease"
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(9, 22, 17, 0.32)",
  backdropFilter: "blur(3px)",
  WebkitBackdropFilter: "blur(3px)",
  zIndex: 55
}

const sidebar = {
  height: "100%",
  borderRadius: "22px",
  background: T.surface,
  border: `1px solid ${T.line}`,
  boxShadow: T.shadow,
  backdropFilter: "blur(10px)", // MUCHO menos blur = menos “plástico”
  WebkitBackdropFilter: "blur(10px)",
  transition: "width 220ms ease, padding 220ms ease",
  display: "flex",
  flexDirection: "column"
}

const sidebarMobile = {
  ...sidebar,
  width: "100%",
  padding: "18px 14px"
}

const topRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
}

const brandMark = {
  width: 28,
  height: 28,
  borderRadius: 10,
  background: "rgba(20,92,67,0.10)",
  border: "1px solid rgba(20,92,67,0.16)",
  display: "grid",
  placeItems: "center",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)"
}

const brandDot = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: T.accent,
  boxShadow: "0 10px 18px rgba(20,92,67,0.18)"
}

const logoWrap = { minWidth: 0 }
const logo = {
  fontSize: 15,
  fontWeight: 800,
  color: T.ink,
  letterSpacing: 0.2,
  lineHeight: 1.1
}
const logoSub = {
  fontSize: 11,
  fontWeight: 700,
  color: T.ink3,
  marginTop: 2,
  letterSpacing: 0.2
}

const iconBtn = {
  width: 36,
  height: 36,
  borderRadius: 12,
  border: `1px solid ${T.line}`,
  background: "rgba(255,255,255,0.8)",
  boxShadow: T.shadow2,
  cursor: "pointer",
  fontWeight: 900,
  color: T.ink,
  transition: "transform 120ms ease, box-shadow 120ms ease"
}

const item = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "11px 12px",
  marginBottom: "10px",
  borderRadius: "14px",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 700,
  border: "1px solid transparent",
  transition: "background 140ms ease, border-color 140ms ease, transform 140ms ease"
}

const itemCollapsed = {
  justifyContent: "center",
  padding: "11px 10px"
}

const itemActive = {
  background: T.accentSoft,
  borderColor: "rgba(20,92,67,0.22)"
}

const itemIcon = {
  width: 24,
  display: "grid",
  placeItems: "center",
  fontSize: 15,
  filter: "saturate(0.95)"
}

const itemIconActive = {
  filter: "saturate(1.05)"
}

const footerHint = {
  marginTop: "auto",
  paddingTop: 14,
  borderTop: `1px solid ${T.line}`
}

const hintTitle = {
  fontSize: 11,
  fontWeight: 900,
  color: T.accent,
  marginBottom: 6,
  letterSpacing: 0.2
}

const hintText = {
  fontSize: 12,
  color: T.ink3,
  lineHeight: 1.35
}
