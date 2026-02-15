import { Link, useLocation } from "react-router-dom"

export default function Sidebar({ hidden = false, onToggle }) {
  const location = useLocation()

  const links = [
    { path: "/dashboard", label: "Overview", icon: "✨" },
    { path: "/companies", label: "Companies", icon: "🏢" },
    { path: "/leads", label: "Leads", icon: "👥" },
    { path: "/pipeline", label: "Pipeline", icon: "🧠" },
    { path: "/calendar", label: "Calendar", icon: "📅" }
  ]

  return (
    <>
      {/* Sidebar */}
      <div
        style={{
          ...sidebarWrapper,
          transform: hidden ? "translateX(-120%)" : "translateX(0)",
          opacity: hidden ? 0 : 1,
          pointerEvents: hidden ? "none" : "auto"
        }}
      >
        <div style={sidebar}>
          <div style={topRow}>
            <div style={logo}>PsicoFunnel</div>

            <button
              type="button"
              onClick={onToggle}
              style={toggleBtn}
              title="Hide sidebar"
            >
              ⟨
            </button>
          </div>

          <div style={{ marginTop: "26px" }}>
            {links.map(link => {
              const active = location.pathname === link.path

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    ...item,
                    background: active
                      ? "linear-gradient(135deg, rgba(20,92,67,0.92), rgba(30,122,87,0.92))"
                      : "transparent",
                    color: active ? "#ffffff" : "#0f3d2e",
                    border: active ? "1px solid rgba(255,255,255,0.14)" : "1px solid transparent",
                    boxShadow: active
                      ? "0 12px 26px rgba(15,61,46,0.22)"
                      : "none"
                  }}
                >
                  <span style={linkLeft}>
                    <span style={emoji}>{link.icon}</span>
                    <span>{link.label}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Floating button when hidden (PC + iPad) */}
      {hidden && (
        <button
          type="button"
          onClick={onToggle}
          style={floatingOpen}
          title="Show sidebar"
        >
          ☰
        </button>
      )}
    </>
  )
}

/* =====================
   Styles
===================== */

const sidebarWrapper = {
  width: "300px",                 // ✅ EXACTO
  padding: "40px 20px",           // ✅ EXACTO
  display: "flex",
  justifyContent: "center",
  position: "fixed",
  top: 0,
  left: 0,
  height: "100vh",
  zIndex: 50,
  transition: "transform 240ms ease, opacity 180ms ease"
}

const sidebar = {
  width: "260px",                 // ✅ EXACTO
  height: "100%",
  padding: "40px 25px",           // ✅ EXACTO
  borderRadius: "32px",           // ✅ EXACTO (no lo toco)
  /* ↓↓↓ Menos “plástico”: menos blanco lechoso + blur más bajo + borde más real */
  background: "rgba(255,255,255,0.42)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: "1px solid rgba(15,61,46,0.10)",
  boxShadow: `
    0 22px 46px rgba(15,61,46,0.12),
    inset 0 1px 0 rgba(255,255,255,0.45)
  `
}

const topRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12
}

const logo = {
  fontSize: "18px",               // ↓ un poco más pro (antes 20)
  fontWeight: "800",
  letterSpacing: "-0.2px",
  color: "#0f3d2e"
}

const toggleBtn = {
  width: 34,
  height: 34,
  borderRadius: 14,
  border: "1px solid rgba(15,61,46,0.14)",
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(10px)",
  cursor: "pointer",
  fontWeight: 900,
  color: "rgba(15,61,46,0.75)",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 10px 20px rgba(15,61,46,0.10)"
}

const item = {
  display: "block",
  padding: "14px 18px",           // ✅ EXACTO
  marginBottom: "14px",           // ✅ EXACTO
  borderRadius: "18px",           // ✅ EXACTO
  textDecoration: "none",
  fontSize: "13px",               // ↓ un toque más pro (antes 14)
  fontWeight: "700",
  transition: "all 0.22s ease"
}

const linkLeft = {
  display: "flex",
  alignItems: "center",
  gap: 10
}

const emoji = {
  width: 26,
  height: 26,
  display: "grid",
  placeItems: "center",
  borderRadius: 10,
  background: "rgba(255,255,255,0.35)",
  border: "1px solid rgba(15,61,46,0.08)"
}

/* Botón flotante para abrir */
const floatingOpen = {
  position: "fixed",
  top: 18,
  left: 18,
  zIndex: 60,
  width: 44,
  height: 44,
  borderRadius: 16,
  border: "1px solid rgba(15,61,46,0.14)",
  background: "rgba(255,255,255,0.58)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  boxShadow: "0 18px 40px rgba(15,61,46,0.14)",
  cursor: "pointer",
  fontWeight: 900,
  color: "#0f3d2e",
  display: "grid",
  placeItems: "center"
}
