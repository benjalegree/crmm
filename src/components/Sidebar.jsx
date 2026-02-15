import { Link, useLocation } from "react-router-dom"
import { useMemo } from "react"

export default function Sidebar({ isMobile, open, onToggle, onClose, onOpen }) {
  const location = useLocation()

  const links = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/companies", label: "Companies" },
    { path: "/leads", label: "Leads" },
    { path: "/pipeline", label: "Pipeline" },
    { path: "/calendar", label: "Calendar" }
  ]

  const collapsed = !isMobile && !open

  const wrapperStyle = useMemo(() => {
    if (isMobile) return sidebarWrapperMobile
    return { ...sidebarWrapper, width: collapsed ? 96 : 280 }
  }, [isMobile, collapsed])

  const panelStyle = useMemo(() => {
    if (isMobile) return sidebarPanelMobile
    return { ...sidebarPanel, width: collapsed ? 80 : 260, padding: collapsed ? "18px 10px" : "18px 14px" }
  }, [isMobile, collapsed])

  return (
    <>
      {isMobile && open ? <div style={overlay} onClick={onClose} aria-hidden="true" /> : null}

      <aside style={wrapperStyle}>
        <div
          style={{
            ...panelStyle,
            transform: isMobile ? (open ? "translateX(0)" : "translateX(-110%)") : "none"
          }}
        >
          <div style={topRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={brandMark} aria-hidden="true" />
              {!collapsed ? (
                <div style={{ minWidth: 0 }}>
                  <div style={brandName}>PsicoFunnel</div>
                  <div style={brandSub}>CRM Workspace</div>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              style={iconBtn}
              onClick={() => {
                if (isMobile) onClose?.()
                else onToggle?.()
              }}
              aria-label={isMobile ? "Close menu" : "Toggle sidebar"}
              title={isMobile ? "Close" : collapsed ? "Expand" : "Collapse"}
            >
              {isMobile ? "✕" : collapsed ? "→" : "←"}
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            {links.map((l) => {
              const active = location.pathname === l.path
              return (
                <Link
                  key={l.path}
                  to={l.path}
                  onClick={() => {
                    if (isMobile) onClose?.()
                  }}
                  style={{
                    ...navItem,
                    ...(collapsed ? navItemCollapsed : null),
                    ...(active ? navItemActive : null)
                  }}
                >
                  <span style={dot} aria-hidden="true" />
                  {!collapsed ? <span style={{ minWidth: 0 }}>{l.label}</span> : null}
                </Link>
              )
            })}
          </div>

          {!collapsed ? (
            <div style={helpBox}>
              <div style={helpTitle}>Help Center</div>
              <div style={helpText}>Colapsá el menú para ganar más espacio.</div>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  )
}

/* ================= STYLES ================= */

const sidebarWrapper = {
  position: "absolute",
  top: 18,
  left: 18,
  bottom: 18,
  zIndex: 20,
  transition: "width 180ms ease"
}

const sidebarWrapperMobile = {
  position: "fixed",
  top: 18,
  left: 18,
  bottom: 18,
  width: 280,
  zIndex: 70
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,23,0.35)",
  backdropFilter: "blur(3px)",
  WebkitBackdropFilter: "blur(3px)",
  zIndex: 65
}

/* panel estilo ref: blanco, bordes suaves, shadow premium */
const sidebarPanel = {
  height: "100%",
  borderRadius: 28,
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(15,23,42,0.08)",
  boxShadow: "0 24px 80px rgba(15,23,42,0.16), inset 0 1px 0 rgba(255,255,255,0.70)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column"
}

const sidebarPanelMobile = {
  ...sidebarPanel,
  transform: "translateX(-110%)",
  transition: "transform 200ms ease"
}

const topRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
}

/* marca simple */
const brandMark = {
  width: 36,
  height: 36,
  borderRadius: 14,
  background: "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(96,165,250,0.10))",
  border: "1px solid rgba(59,130,246,0.18)",
  boxShadow: "0 14px 28px rgba(59,130,246,0.14)"
}

const brandName = {
  fontWeight: 950,
  color: "#0f172a",
  fontSize: 14,
  letterSpacing: 0.1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const brandSub = {
  marginTop: 2,
  fontWeight: 750,
  fontSize: 12,
  color: "rgba(15,23,42,0.55)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const iconBtn = {
  width: 38,
  height: 38,
  borderRadius: 14,
  border: "1px solid rgba(15,23,42,0.10)",
  background: "rgba(255,255,255,0.80)",
  boxShadow: "0 14px 28px rgba(15,23,42,0.10)",
  cursor: "pointer",
  fontWeight: 950,
  color: "rgba(15,23,42,0.80)"
}

const navItem = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 12px",
  borderRadius: 16,
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 13,
  color: "rgba(15,23,42,0.72)",
  border: "1px solid transparent",
  transition: "background 160ms ease, border 160ms ease, color 160ms ease",
  marginTop: 8
}

const navItemCollapsed = {
  justifyContent: "center",
  padding: "12px 10px"
}

const navItemActive = {
  background: "rgba(59,130,246,0.16)",
  border: "1px solid rgba(59,130,246,0.18)",
  color: "#0f172a",
  boxShadow: "0 16px 34px rgba(59,130,246,0.14)"
}

/* puntito funcional (no decorativo “ruido”) */
const dot = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "rgba(59,130,246,0.65)",
  boxShadow: "0 10px 20px rgba(59,130,246,0.18)"
}

const helpBox = {
  marginTop: "auto",
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(15,23,42,0.08)",
  background: "rgba(59,130,246,0.06)"
}

const helpTitle = {
  fontWeight: 950,
  color: "#0f172a",
  fontSize: 12
}

const helpText = {
  marginTop: 6,
  fontWeight: 750,
  color: "rgba(15,23,42,0.60)",
  fontSize: 12,
  lineHeight: 1.35
}
