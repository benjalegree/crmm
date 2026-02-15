import { Link, useLocation } from "react-router-dom"

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()

  const links = [
    { path: "/dashboard", label: "Dashboard", icon: "▦" },
    { path: "/companies", label: "Companies", icon: "⌂" },
    { path: "/leads", label: "Leads", icon: "◷" },
    { path: "/pipeline", label: "Pipeline", icon: "⇄" },
    { path: "/calendar", label: "Calendar", icon: "◴" }
  ]

  return (
    <aside style={{ ...wrap, width: collapsed ? 88 : 270 }}>
      <div style={{ ...side, width: collapsed ? 70 : 240 }}>
        {/* TOP */}
        <div style={top}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={mark} />
            <div style={{ minWidth: 0, display: collapsed ? "none" : "block" }}>
              <div style={brand}>PsicoFunnel</div>
              <div style={brandSub}>CRM</div>
            </div>
          </div>

          <button type="button" style={toggleBtn} onClick={onToggle} title="Toggle sidebar">
            {collapsed ? "⟩" : "⟨"}
          </button>
        </div>

        {/* NAV */}
        <nav style={nav}>
          {links.map((link) => {
            const active = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  ...item,
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "10px 8px" : "10px 12px",
                  gap: collapsed ? 0 : 10,
                  background: active ? "rgba(20,92,67,0.10)" : "transparent",
                  borderColor: active ? "rgba(20,92,67,0.18)" : "rgba(0,0,0,0.06)"
                }}
              >
                <span
                  style={{
                    ...icon,
                    background: active ? "rgba(20,92,67,0.10)" : "rgba(0,0,0,0.03)",
                    borderColor: active ? "rgba(20,92,67,0.16)" : "rgba(0,0,0,0.06)",
                    color: active ? "#145c43" : "rgba(0,0,0,0.55)"
                  }}
                >
                  {link.icon}
                </span>

                <span style={{ ...label, display: collapsed ? "none" : "block" }}>
                  {link.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* BOTTOM */}
        <div style={bottom}>
          <div style={{ ...hint, display: collapsed ? "none" : "block" }}>
            Tip: “Customize” para columnas
          </div>

          <div style={{ ...userPill, justifyContent: collapsed ? "center" : "space-between" }}>
            <span style={onlineDot} />
            <span style={{ ...userText, display: collapsed ? "none" : "block" }}>Online</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

/* =====================
   STYLES (CLARO / PRO)
===================== */

const wrap = {
  height: "100vh",
  padding: "18px 14px",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "stretch",
  justifyContent: "flex-start"
}

const side = {
  height: "100%",
  borderRadius: 18,
  background: "rgba(255,255,255,0.70)",
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 14px 40px rgba(15,61,46,0.10)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  padding: "14px 10px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column"
}

const top = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "6px 6px 10px"
}

const mark = {
  width: 12,
  height: 12,
  borderRadius: 4,
  background: "linear-gradient(135deg, #145c43, #1e7a57)",
  boxShadow: "0 8px 18px rgba(20,92,67,0.18)"
}

const brand = {
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: "-0.2px",
  color: "#0f3d2e",
  lineHeight: "16px"
}

const brandSub = {
  marginTop: 2,
  fontSize: 11,
  fontWeight: 800,
  color: "rgba(0,0,0,0.45)"
}

const toggleBtn = {
  width: 32,
  height: 32,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.70)",
  cursor: "pointer",
  fontWeight: 900,
  color: "rgba(0,0,0,0.65)"
}

const nav = {
  marginTop: 6,
  padding: "0 6px",
  display: "flex",
  flexDirection: "column"
}

const item = {
  display: "flex",
  alignItems: "center",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.06)",
  textDecoration: "none",
  marginBottom: 10,
  transition: "background 0.15s ease, border-color 0.15s ease",
  color: "#0f3d2e"
}

const icon = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.06)",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  fontSize: 14
}

const label = {
  fontSize: 13,
  fontWeight: 800,
  color: "rgba(0,0,0,0.75)"
}

const bottom = {
  marginTop: "auto",
  padding: "12px 6px 6px",
  borderTop: "1px solid rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 10
}

const hint = {
  fontSize: 11,
  fontWeight: 800,
  color: "rgba(0,0,0,0.45)"
}

const userPill = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.70)",
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  boxSizing: "border-box"
}

const onlineDot = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "#1e7a57",
  boxShadow: "0 0 0 3px rgba(30,122,87,0.12)"
}

const userText = {
  fontSize: 12,
  fontWeight: 800,
  color: "rgba(0,0,0,0.60)"
}
