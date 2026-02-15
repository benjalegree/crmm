import { Link, useLocation } from "react-router-dom"
import { useMemo } from "react"

const T = {
  // Glass base
  glassA: "rgba(255,255,255,0.12)",
  glassB: "rgba(255,255,255,0.07)",
  borderA: "rgba(255,255,255,0.18)",
  borderB: "rgba(0,0,0,0.25)",
  ink: "rgba(255,255,255,0.92)",
  ink2: "rgba(255,255,255,0.78)",
  ink3: "rgba(255,255,255,0.60)",

  // Verde inglés (premium)
  accent: "#1FAE7A",
  accentDeep: "#145C43",
  accentInk: "#0B241C",
  accentSoft: "rgba(31,174,122,0.18)",
  accentSoft2: "rgba(31,174,122,0.26)",

  // Sombras (controladas)
  shadow: "0 26px 70px rgba(0,0,0,0.35)",
  shadow2: "0 14px 34px rgba(0,0,0,0.26)"
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

  const isCollapsedDesktop = !isMobile && !open

  const wrapperStyle = useMemo(() => {
    if (isMobile) {
      return {
        ...sidebarWrapperMobile,
        transform: open ? "translateX(0)" : "translateX(-110%)"
      }
    }
    return { ...sidebarWrapper, width: isCollapsedDesktop ? "110px" : "282px" }
  }, [isMobile, open, isCollapsedDesktop])

  const panelStyle = useMemo(() => {
    if (isMobile) return sidebarMobile
    return {
      ...sidebar,
      width: isCollapsedDesktop ? "86px" : "258px",
      padding: isCollapsedDesktop ? "18px 10px" : "20px 14px"
    }
  }, [isMobile, isCollapsedDesktop])

  return (
    <>
      {isMobile && open ? <div style={overlay} onClick={onClose} aria-hidden="true" /> : null}

      <div style={wrapperStyle}>
        <div style={panelStyle}>
          {/* Sheen line top */}
          <div aria-hidden="true" style={sheenTop} />
          {/* Inner grain */}
          <div aria-hidden="true" style={innerGrain} />

          <div style={topRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={brandMark}>
                <span style={brandDot} />
              </div>

              {!isCollapsedDesktop ? (
                <div style={logoWrap}>
                  <div style={logo}>PsicoFunnel</div>
                  <div style={logoSub}>Sales Workspace</div>
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
                  <span style={{ ...itemIconWrap, ...(active ? itemIconWrapActive : {}) }}>
                    <span style={itemIcon}>{link.icon}</span>
                  </span>

                  {!isCollapsedDesktop ? (
                    <span style={itemLabel}>{link.label}</span>
                  ) : null}
                </Link>
              )
            })}
          </div>

          {!isCollapsedDesktop ? (
            <div style={footerHint}>
              <div style={hintTitle}>Tip</div>
              <div style={hintText}>Arrastrá leads en Pipeline y usá el menú colapsado para foco.</div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

/* ========== STYLES ========== */

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
  background: "rgba(0,0,0,0.42)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  zIndex: 55
}

const sidebar = {
  position: "relative",
  height: "100%",
  borderRadius: "24px",
  background: `
    linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06))
  `,
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 28px 80px rgba(0,0,0,0.38)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  transition: "width 220ms ease, padding 220ms ease",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
}

const sidebarMobile = {
  ...sidebar,
  width: "100%",
  padding: "18px 14px"
}

const sheenTop = {
  position: "absolute",
  left: -60,
  right: -60,
  top: -60,
  height: 140,
  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
  transform: "rotate(-10deg)",
  opacity: 0.55,
  pointerEvents: "none"
}

const innerGrain = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.12,
  backgroundImage: `
    repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 3px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.018) 0, rgba(0,0,0,0.018) 1px, transparent 1px, transparent 3px)
  `,
  mixBlendMode: "overlay"
}

const topRow = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
}

const brandMark = {
  width: 30,
  height: 30,
  borderRadius: 12,
  background: "rgba(31,174,122,0.14)",
  border: "1px solid rgba(31,174,122,0.26)",
  display: "grid",
  placeItems: "center",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)"
}

const brandDot = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(255,255,255,0.0) 55%), #1FAE7A",
  boxShadow: "0 10px 18px rgba(31,174,122,0.26)"
}

const logoWrap = { minWidth: 0 }
const logo = {
  fontSize: 15,
  fontWeight: 900,
  letterSpacing: 0.25,
  color: "rgba(255,255,255,0.92)",
  lineHeight: 1.1
}
const logoSub = {
  fontSize: 11,
  fontWeight: 700,
  color: "rgba(255,255,255,0.62)",
  marginTop: 2,
  letterSpacing: 0.2
}

const iconBtn = {
  width: 36,
  height: 36,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.10)",
  boxShadow: "0 14px 30px rgba(0,0,0,0.26)",
  cursor: "pointer",
  fontWeight: 900,
  color: "rgba(255,255,255,0.90)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)"
}

const item = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "11px 12px",
  marginBottom: "10px",
  borderRadius: "14px",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 800,
  border: "1px solid rgba(255,255,255,0.0)",
  background: "transparent",
  transition: "transform 140ms ease, background 160ms ease, border-color 160ms ease, box-shadow 160ms ease"
}

const itemCollapsed = {
  justifyContent: "center",
  padding: "11px 10px"
}

const itemActive = {
  background: `
    linear-gradient(180deg, rgba(31,174,122,0.18), rgba(31,174,122,0.10))
  `,
  borderColor: "rgba(31,174,122,0.26)",
  boxShadow: "0 16px 36px rgba(0,0,0,0.18)"
}

const itemIconWrap = {
  width: 34,
  height: 34,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)"
}

const itemIconWrapActive = {
  background: "rgba(31,174,122,0.16)",
  border: "1px solid rgba(31,174,122,0.26)"
}

const itemIcon = {
  fontSize: 15,
  filter: "saturate(1.05)",
  transform: "translateY(-0.5px)"
}

const itemLabel = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const footerHint = {
  position: "relative",
  zIndex: 2,
  marginTop: "auto",
  paddingTop: 14,
  borderTop: "1px solid rgba(255,255,255,0.10)"
}

const hintTitle = {
  fontSize: 11,
  fontWeight: 900,
  color: "rgba(31,174,122,0.92)",
  marginBottom: 6,
  letterSpacing: 0.25
}

const hintText = {
  fontSize: 12,
  color: "rgba(255,255,255,0.62)",
  lineHeight: 1.35
}
