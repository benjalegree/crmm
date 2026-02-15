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

  const topStyle = useMemo(() => (isMobile ? topbarMobile : topbar), [isMobile])

  return (
    <>
      {/* Topbar pill (dentro del Stage) */}
      <div style={topStyle}>
        <div style={pill}>
          <div style={left}>
            {isMobile ? (
              <button
                type="button"
                style={iconBtn}
                onClick={() => (open ? onClose?.() : onOpen?.())}
                aria-label="Menu"
                title="Menu"
              >
                ☰
              </button>
            ) : null}

            <div style={brand}>
              <div style={brandDot} aria-hidden="true" />
              <div style={brandText}>
                <div style={brandName}>PsicoFunnel</div>
                <div style={brandSub}>CRM</div>
              </div>
            </div>
          </div>

          {!isMobile ? (
            <nav style={nav}>
              {links.map((l) => {
                const active = activePath === l.path
                return (
                  <Link
                    key={l.path}
                    to={l.path}
                    style={{
                      ...tab,
                      ...(active ? tabActive : null)
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

          <div style={right}>
            <button type="button" style={iconBtn} aria-label="Search" title="Search">
              ⌕
            </button>
            <button type="button" style={iconBtn} aria-label="Settings" title="Settings">
              ⚙
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
              <div style={drawerTitle}>Navigation</div>
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

/* ================= TOKENS ================= */

const C = {
  ink: "#0f3d2e",
  ink2: "rgba(15,61,46,0.70)",
  stroke: "rgba(15,61,46,0.12)",
  glassA: "rgba(255,255,255,0.72)",
  glassB: "rgba(255,255,255,0.52)",
  shadow: "0 18px 50px rgba(0,0,0,0.10)",
  highlightInset: "inset 0 1px 0 rgba(255,255,255,0.60)"
}

/* ================= TOPBAR ================= */

const topbar = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 14,
  padding: "0 18px",
  zIndex: 20
}

const topbarMobile = {
  ...topbar,
  top: 12,
  padding: "0 14px"
}

/* pill interna como refs */
const pill = {
  height: 60,
  borderRadius: 999,
  background: `linear-gradient(180deg, ${C.glassA}, ${C.glassB})`,
  border: `1px solid ${C.stroke}`,
  boxShadow: C.shadow,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  gap: 12,
  boxSizing: "border-box",
  boxShadow: `${C.shadow}, ${C.highlightInset}`
}

const left = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 240
}

const right = {
  display: "flex",
  alignItems: "center",
  gap: 8
}

const brand = {
  display: "flex",
  alignItems: "center",
  gap: 10
}

const brandDot = {
  width: 26,
  height: 26,
  borderRadius: 10,
  background:
    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(255,255,255,0) 55%), rgba(20,92,67,0.20)",
  border: "1px solid rgba(20,92,67,0.16)"
}

const brandText = { display: "flex", flexDirection: "column", lineHeight: 1.05 }

const brandName = {
  fontWeight: 950,
  letterSpacing: 0.2,
  color: C.ink,
  fontSize: 13
}

const brandSub = {
  fontWeight: 850,
  color: "rgba(15,61,46,0.55)",
  fontSize: 11,
  marginTop: 2
}

/* tabs */
const nav = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: 5,
  borderRadius: 999,
  background: "rgba(15,61,46,0.05)",
  border: "1px solid rgba(15,61,46,0.08)"
}

const tab = {
  textDecoration: "none",
  color: "rgba(15,61,46,0.70)",
  fontWeight: 950,
  fontSize: 12,
  padding: "9px 12px",
  borderRadius: 999,
  transition: "background 160ms ease, color 160ms ease"
}

const tabActive = {
  background: "rgba(20,92,67,0.12)",
  color: C.ink
}

/* botones soft (sin “plástico”) */
const iconBtn = {
  width: 38,
  height: 38,
  borderRadius: 12,
  border: "1px solid rgba(15,61,46,0.12)",
  background: "rgba(255,255,255,0.58)",
  cursor: "pointer",
  fontWeight: 950,
  color: "rgba(15,61,46,0.85)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 12px 30px rgba(15,61,46,0.10)",
  transition: "transform 120ms ease"
}

const avatar = {
  width: 34,
  height: 34,
  borderRadius: 999,
  border: "1px solid rgba(15,61,46,0.14)",
  background:
    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(255,255,255,0) 55%), rgba(20,92,67,0.18)"
}

/* ================= DRAWER MOBILE ================= */

const overlay = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.28)",
  backdropFilter: "blur(3px)",
  WebkitBackdropFilter: "blur(3px)",
  zIndex: 25
}

const drawer = {
  position: "absolute",
  top: 86,
  left: 16,
  width: 300,
  maxWidth: "calc(100% - 32px)",
  borderRadius: 18,
  padding: 12,
  background: "linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.56))",
  border: "1px solid rgba(15,61,46,0.12)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.20)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  transition: "transform 200ms ease",
  zIndex: 30
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
  color: C.ink
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
  fontWeight: 950,
  fontSize: 13,
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid transparent",
  background: "transparent"
}

const drawerLinkActive = {
  background: "rgba(20,92,67,0.12)",
  border: "1px solid rgba(20,92,67,0.16)",
  color: C.ink
}
