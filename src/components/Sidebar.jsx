import { Link, useLocation } from "react-router-dom"

export default function Sidebar({ collapsed = false, onToggle }) {
  const location = useLocation()

  const links = [
    { path: "/dashboard", label: "Overview", emoji: "✨" },
    { path: "/companies", label: "Companies", emoji: "🏢" },
    { path: "/leads", label: "Leads", emoji: "👥" },
    { path: "/pipeline", label: "Pipeline", emoji: "🧠" },
    { path: "/calendar", label: "Calendar", emoji: "📅" }
  ]

  return (
    <aside
      style={{
        ...wrap,
        width: collapsed ? 88 : 280
      }}
    >
      <div style={panel}>
        <div style={top}>
          <button
            type="button"
            onClick={onToggle}
            style={toggleBtn}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "→" : "←"}
          </button>

          <div style={{ minWidth: 0 }}>
            <div style={{ ...brand, opacity: collapsed ? 0 : 1 }}>
              PsicoFunnel
              <span style={brandDot}>CRM</span>
            </div>
            <div style={{ ...tagline, opacity: collapsed ? 0 : 1 }}>
              Focused pipeline & follow-ups
            </div>
          </div>
        </div>

        <nav style={nav}>
          {links.map((link) => {
            const active = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  ...item,
                  ...(active ? itemActive : {}),
                  justifyContent: collapsed ? "center" : "space-between"
                }}
                title={collapsed ? link.label : ""}
              >
                <span style={left}>
                  <span
                    style={{
                      ...icon,
                      ...(active ? iconActive : {})
                    }}
                  >
                    {link.emoji}
                  </span>

                  <span style={{ ...label, display: collapsed ? "none" : "inline" }}>
                    {link.label}
                  </span>
                </span>

                {!collapsed ? (
                  <span style={{ ...chev, opacity: active ? 1 : 0.35 }}>›</span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div style={bottom}>
          {!collapsed ? (
            <div style={hint}>
              Tip: colapsá el sidebar para más espacio en iPad
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

/* ============ STYLES ============ */

const wrap = {
  position: "fixed",
  left: 0,
  top: 0,
  height: "100%",
  padding: "18px 14px",
  boxSizing: "border-box",
  transition: "width 280ms cubic-bezier(.2,.8,.2,1)",
  zIndex: 50
}

const panel = {
  height: "100%",
  borderRadius: 18, // sutil
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(32px)",
  WebkitBackdropFilter: "blur(32px)",
  border: "1px solid rgba(15,61,46,0.08)",
  boxShadow: "0 18px 48px rgba(15,61,46,0.14)",
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  overflow: "hidden"
}

const top = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "6px 6px 10px 6px",
  borderBottom: "1px solid rgba(15,61,46,0.08)"
}

const toggleBtn = {
  width: 34,
  height: 34,
  borderRadius: 12, // menos redondo
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.75)",
  cursor: "pointer",
  fontWeight: 900,
  color: "rgba(0,0,0,0.70)",
  display: "grid",
  placeItems: "center"
}

const brand = {
  fontSize: 16, // antes grande -> más pro
  fontWeight: 900,
  color: "#0f3d2e",
  letterSpacing: "-0.2px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  transition: "opacity 180ms ease"
}

const brandDot = {
  marginLeft: 8,
  fontSize: 11,
  fontWeight: 900,
  padding: "4px 8px",
  borderRadius: 999,
  background: "rgba(20,92,67,0.10)",
  border: "1px solid rgba(20,92,67,0.18)",
  color: "#145c43"
}

const tagline = {
  marginTop: 4,
  fontSize: 11,
  fontWeight: 700,
  color: "rgba(0,0,0,0.48)",
  transition: "opacity 180ms ease"
}

const nav = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  paddingTop: 6
}

const item = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 10px",
  borderRadius: 14, // sutil
  textDecoration: "none",
  border: "1px solid transparent",
  color: "rgba(0,0,0,0.70)",
  fontWeight: 800,
  fontSize: 13,
  transition: "transform 160ms ease, background 160ms ease, border 160ms ease, box-shadow 160ms ease"
}

const itemActive = {
  background: "linear-gradient(135deg, rgba(20,92,67,0.14), rgba(30,122,87,0.10))",
  border: "1px solid rgba(20,92,67,0.22)",
  boxShadow: "0 10px 24px rgba(15,61,46,0.10)",
  transform: "translateY(-1px)"
}

const left = { display: "flex", alignItems: "center", gap: 10, minWidth: 0 }

const icon = {
  width: 30,
  height: 30,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.75)",
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)"
}

const iconActive = {
  background: "rgba(20,92,67,0.12)",
  border: "1px solid rgba(20,92,67,0.18)"
}

const label = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: "rgba(0,0,0,0.72)"
}

const chev = {
  fontSize: 16,
  fontWeight: 900,
  color: "rgba(0,0,0,0.40)"
}

const bottom = {
  marginTop: "auto",
  paddingTop: 10,
  borderTop: "1px solid rgba(15,61,46,0.08)"
}

const hint = {
  fontSize: 11,
  fontWeight: 700,
  color: "rgba(0,0,0,0.48)",
  lineHeight: 1.3
}
