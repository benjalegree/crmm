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

  const activePath = location.pathname

  const shellStyle = useMemo(() => {
    return isMobile ? topbarMobileShell : topbarShell
  }, [isMobile])

  return (
    <>
      {/* Topbar */}
      <div style={shellStyle}>
        <div style={topbarInner}>
          <div style={brandRow}>
            {isMobile ? (
              <button
                type="button"
                style={iconBtn}
                onClick={() => (open ? onClose?.() : onOpen?.())}
                aria-label="Open menu"
                title="Menu"
              >
                ☰
              </button>
            ) : null}

            <div style={brandMark} aria-hidden="true" />
            <div style={brandText}>
              <div style={brandName}>PsicoFunnel</div>
              <div style={brandSub}>CRM</div>
            </div>
          </div>

          {/* Links desktop */}
          {!isMobile ? (
            <nav style={nav}>
              {links.map((l) => {
                const active = activePath === l.path
                return (
                  <Link
                    key={l.path}
                    to={l.path}
                    style={{
                      ...navLink,
                      ...(active ? navLinkActive : null)
                    }}
                  >
                    {l.label}
                  </Link>
                )
              })}
            </nav>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {/* Acciones derecha */}
          <div style={rightActions}>
            <button type="button" style={iconBtn} aria-label="Search" title="Search">
              ⌕
            </button>
            <button type="button" style={iconBtn} aria-label="Theme" title="Theme">
              ◐
            </button>
            <div style={avatar} title="Profile" />
          </div>
        </div>
      </div>

      {/* Drawer mobile */}
      {isMobile ? (
        <>
          {open ? <div style={overlay} onClick={onClose} aria-hidden="true" /> : null}

          <div
            style={{
              ...drawer,
              transform: open ? "translateX(0)" : "translateX(-110%)"
            }}
            role="dialog"
            aria-modal="true"
          >
            <div style={drawerHead}>
              <div style={drawerTitle}>Menu</div>
              <button type="button" style={iconBtn} onClick={onClose} aria-label="Close">
                ✕
              </button>
            </div>

            <div style={drawerList}>
              {links.map((l) => {
                const active = activePath === l.path
                return (
                  <Link
                    key={l.path}
                    to={l.path}
                    onClick={() => onClose?.()}
                    style={{
                      ...drawerLink,
                      ...(active ? drawerLinkActive : null)
                    }}
                  >
                    {l.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}

/* ================= STYLES ================= */

const topbarShell = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 60,
  height: 72,
  padding: "12px 18px",
  background:
    "linear-gradient(180deg, rgba(244,251,248,0.80), rgba(244,251,248,0.60))",
  borderBottom: "1px solid rgba(15,61,46,0.10)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)"
}

const topbarMobileShell = {
  ...topbarShell,
  height: 68,
  padding: "10px 12px"
}

const topbarInner = {
  height: "100%",
  maxWidth: 1200,
  margin: "0 auto",
  borderRadius: 16,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.45))",
  border: "1px solid rgba(15,61,46,0.10)",
  boxShadow: "0 18px 50px rgba(15,61,46,0.10)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  gap: 12
}

const brandRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 220
}

const brandMark = {
  width: 28,
  height: 28,
  borderRadius: 10,
  background:
    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0) 55%), rgba(20,92,67,0.22)",
  border: "1px solid rgba(20,92,67,0.18)"
}

const brandText = { display: "flex", flexDirection: "column", lineHeight: 1.1 }
const brandName = {
  fontWeight: 900,
  letterSpacing: 0.2,
  color: "#0f3d2e",
  fontSize: 14
}
const brandSub = {
  fontWeight: 800,
  color: "rgba(15,61,46,0.55)",
  fontSize: 11,
  marginTop: 2
}

const nav = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: 6,
  borderRadius: 999,
  background: "rgba(15,61,46,0.06)",
  border: "1px solid rgba(15,61,46,0.08)"
}

const navLink = {
  textDecoration: "none",
  color: "rgba(15,61,46,0.70)",
  fontWeight: 900,
  fontSize: 12,
  padding: "9px 12px",
  borderRadius: 999,
  transition: "background 160ms ease, color 160ms ease"
}

const navLinkActive = {
  background: "rgba(20,92,67,0.14)",
  color: "#0f3d2e"
}

const rightActions = {
  display: "flex",
  alignItems: "center",
  gap: 8
}

const iconBtn = {
  width: 38,
  height: 38,
  borderRadius: 12,
  border: "1px solid rgba(15,61,46,0.10)",
  background: "rgba(255,255,255,0.55)",
  cursor: "pointer",
  fontWeight: 900,
  color: "rgba(15,61,46,0.85)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 10px 24px rgba(15,61,46,0.08)",
  transition: "transform 120ms ease"
}

const avatar = {
  width: 34,
  height: 34,
  borderRadius: 999,
  border: "1px solid rgba(15,61,46,0.12)",
  background:
    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0) 55%), rgba(20,92,67,0.18)"
}

/* Drawer */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.30)",
  backdropFilter: "blur(3px)",
  WebkitBackdropFilter: "blur(3px)",
  zIndex: 65
}

const drawer = {
  position: "fixed",
  top: 84,
  left: 12,
  width: 280,
  maxWidth: "calc(100vw - 24px)",
  borderRadius: 18,
  zIndex: 70,
  padding: 12,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.52))",
  border: "1px solid rgba(15,61,46,0.12)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.22)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  transition: "transform 200ms ease"
}

const drawerHead = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  paddingBottom: 10,
  borderBottom: "1px solid rgba(15,61,46,0.10)"
}

const drawerTitle = {
  fontWeight: 950,
  color: "#0f3d2e"
}

const drawerList = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  paddingTop: 10
}

const drawerLink = {
  textDecoration: "none",
  color: "rgba(15,61,46,0.80)",
  fontWeight: 900,
  fontSize: 13,
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid transparent",
  background: "transparent"
}

const drawerLinkActive = {
  background: "rgba(20,92,67,0.12)",
  border: "1px solid rgba(20,92,67,0.18)",
  color: "#0f3d2e"
}
