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
      {/* Topbar (píldora) */}
      <header style={topStyle}>
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
              <div style={brandMark} aria-hidden="true" />
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
      </header>

      {/* Drawer mobile */}
      {isMobile ? (
        <>
          {open ? <div style={overlay} onClick={onClose} aria-hidden="true" /> : null}

          <aside
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
          </aside>
        </>
      ) : null}
    </>
  )
}

/* ================= TOKENS ================= */

const C = {
  stroke: "rgba(255,255,255,0.14)",
  strokeSoft: "rgba(255,255,255,0.22)",
  glassA: "rgba(255,255,255,0.14)",
  glassB: "rgba(255,255,255,0.08)",
  shadow: "0 22px 70px rgba(0,0,0,0.35)",
  highlightInset: "inset 0 1px 0 rgba(255,255,255,0.18)",
  ink: "rgba(255,255,255,0.92)",
  ink2: "rgba(255,255,255,0.68)"
}

/* ================= TOPBAR ================= */

/* full width, pero pill centrada */
const topbar = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 18,
  zIndex: 50,
  padding: "0 22px",
  boxSizing: "border-box"
}

const topbarMobile = {
  ...topbar,
  top: 14,
  padding: "0 14px"
}

/* pill “soft glass” sobre fondo verde */
const pill = {
  width: "min(1280px, 100%)",
  margin: "0 auto",
  height: 60,
  borderRadius: 999,
  background: `linear-gradient(180deg, ${C.glassA}, ${C.glassB})`,
  border: `1px solid ${C.stroke}`,
  boxShadow: `${C.shadow}, ${C.highlightInset}`,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  gap: 12,
  boxSizing: "border-box"
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

/* marca minimal premium (sin emoji) */
const brandMark = {
  width: 26,
  height: 26,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background:
    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.32), rgba(255,255,255,0) 55%), rgba(43,218,154,0.18)"
}

const brandText = { display: "flex", flexDirection: "column", lineHeight: 1.05 }

const brandName = {
  fontWeight: 980,
  letterSpacing: 0.2,
  color: C.ink,
  fontSize: 13
}

const brandSub = {
  fontWeight: 850,
  color: "rgba(255,255,255,0.62)",
  fontSize: 11,
  marginTop: 2
}

/* tabs: compactas, sin ruido */
const nav = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: 5,
  borderRadius: 999,
  border: `1px solid ${C.strokeSoft}`,
  background: "rgba(255,255,255,0.06)"
}

const tab = {
  textDecoration: "none",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 950,
  fontSize: 12,
  padding: "9px 12px",
  borderRadius: 999,
  transition: "background 160ms ease, color 160ms ease, border 160ms ease",
  border: "1px solid transparent"
}

const tabActive = {
  background: "rgba(43,218,154,0.14)",
  border: "1px solid rgba(43,218,154,0.22)",
  color: "rgba(255,255,255,0.92)"
}

/* icon buttons: soft, no “plástico” */
const iconBtn = {
  width: 38,
  height: 38,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.08)",
  cursor: "pointer",
  fontWeight: 950,
  color: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 16px 40px rgba(0,0,0,0.26)",
  transition: "transform 120ms ease"
}

const avatar = {
  width: 34,
  height: 34,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.18)",
  background:
    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%), rgba(43,218,154,0.16)"
}

/* ================= DRAWER MOBILE ================= */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.34)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  zIndex: 55
}

const drawer = {
  position: "fixed",
  top: 90,
  left: 14,
  width: 300,
  maxWidth: "calc(100% - 28px)",
  borderRadius: 18,
  padding: 12,
  background: "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08))",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  transition: "transform 200ms ease",
  zIndex: 60
}

const drawerHead = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  paddingBottom: 10,
  borderBottom: "1px solid rgba(255,255,255,0.14)"
}

const drawerTitle = {
  fontWeight: 950,
  color: "rgba(255,255,255,0.90)"
}

const drawerList = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  paddingTop: 10
}

const drawerLink = {
  textDecoration: "none",
  color: "rgba(255,255,255,0.80)",
  fontWeight: 950,
  fontSize: 13,
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid transparent",
  background: "transparent"
}

const drawerLinkActive = {
  background: "rgba(43,218,154,0.14)",
  border: "1px solid rgba(43,218,154,0.22)",
  color: "rgba(255,255,255,0.92)"
}
