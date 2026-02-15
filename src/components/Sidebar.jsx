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
    <aside style={wrap}>
      <div style={{ ...side, width: collapsed ? 72 : 260 }}>
        <div style={top}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={mark} />
            <div style={{ minWidth: 0 }}>
              <div style={{ ...brand, display: collapsed ? "none" : "block" }}>
                PsicoFunnel
              </div>
              <div style={{ ...brandSub, display: collapsed ? "none" : "block" }}>
                CRM
              </div>
            </div>
          </div>

          <button
            type="button"
            style={toggleBtn}
            onClick={onToggle}
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            {collapsed ? "⟩" : "⟨"}
          </button>
        </div>

        <nav style={{ marginTop: 18 }}>
          {links.map((link) => {
            const active = location.pathname === link.path

            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  ...item,
                  padding: collapsed ? "12px 10px" : "12px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: collapsed ? 0 : 10,
                  background: active ? "rgba(31,122,90,0.20)" : "transparent",
                  borderColor: active ? "rgba(42,163,122,0.28)" : "rgba(255,255,255,0.06)",
                  boxShadow: active ? "0 10px 26px rgba(0,0,0,0.30)" : "none"
                }}
              >
                <span
                  style={{
                    ...icon,
                    background: active ? "rgba(42,163,122,0.16)" : "rgba(255,255,255,0.05)",
                    borderColor: active ? "rgba(42,163,122,0.28)" : "rgba(255,255,255,0.08)",
                    color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.70)"
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

        <div style={bottom}>
          <div style={{ ...hint, display: collapsed ? "none" : "block" }}>
            Tips: usá “Customize” para columnas
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between"
            }}
          >
            <div
              style={{
                ...userPill,
                justifyContent: collapsed ? "center" : "space-between"
              }}
            >
              <span style={avatar} />
              <span style={{ ...userText, display: collapsed ? "none" : "block" }}>
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

/* =====================
   STYLES
===================== */

/**
 * CLAVE:
 * - el wrap ocupa SIEMPRE el 100% de la columna del Layout
 * - y el "side" se pega a la izquierda (no se centra raro)
 */
const wrap = {
  width: "100%",
  height: "100vh",
  padding: "18px 14px",
  display: "flex",
  alignItems: "stretch",
  justifyContent: "flex-start", // <- FIX: no lo centres
  boxSizing: "border-box"
}

const side = {
  height: "100%",
  borderRadius: 20,
  background: "linear-gradient(180deg, rgba(16,24,22,0.72), rgba(12,18,17,0.78))",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 18px 55px rgba(0,0,0,0.50)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  padding: "16px 12px",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box"
}

const top = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
}

const mark = {
  width: 12,
  height: 12,
  borderRadius: 4,
  background: "linear-gradient(135deg, var(--accent), var(--accent2))",
  boxShadow: "0 10px 20px rgba(31,122,90,0.30)"
}

const brand = {
  fontSize: 14,
  fontWeight: 900,
  letterSpacing: "-0.2px",
  color: "var(--text)",
  lineHeight: "16px"
}

const brandSub = {
  marginTop: 2,
  fontSize: 11,
  fontWeight: 800,
  color: "var(--muted2)"
}

const toggleBtn = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--text)",
  cursor: "pointer",
  fontWeight: 900
}

const item = {
  display: "flex",
  alignItems: "center",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.06)",
  textDecoration: "none",
  color: "var(--text)",
  marginBottom: 10,
  transition: "transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease"
}

const icon = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  fontSize: 14
}

const label = {
  fontSize: 13,
  fontWeight: 800,
  color: "rgba(255,255,255,0.86)"
}

const bottom = {
  marginTop: "auto",
  paddingTop: 12,
  borderTop: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: 10
}

const hint = {
  fontSize: 11,
  fontWeight: 800,
  color: "rgba(255,255,255,0.48)"
}

const userPill = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  gap: 10
}

const avatar = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "var(--accent2)",
  boxShadow: "0 0 0 3px rgba(42,163,122,0.16)",
  display: "inline-block"
}

const userText = {
  fontSize: 12,
  fontWeight: 800,
  color: "rgba(255,255,255,0.72)"
}
