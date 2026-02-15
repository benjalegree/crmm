import { Link, useLocation } from "react-router-dom"

export default function Sidebar({ open = true, onToggle }) {
  const location = useLocation()

  const links = [
    { path: "/dashboard", label: "Overview" },
    { path: "/companies", label: "Companies" },
    { path: "/leads", label: "Leads" },
    { path: "/pipeline", label: "Pipeline" },
    { path: "/calendar", label: "Calendar" }
  ]

  return (
    <>
      {/* Overlay solo en mobile/tablet cuando está abierto */}
      {open ? <div style={overlay} onClick={onToggle} /> : null}

      <div
        style={{
          ...sidebarWrapper,
          width: open ? 280 : 72
        }}
      >
        <div
          style={{
            ...sidebar,
            width: open ? 248 : 56
          }}
        >
          <div style={top}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={logoMark} />
              {open ? <div style={logoText}>PsicoFunnel</div> : null}
            </div>

            <button
              type="button"
              onClick={onToggle}
              style={collapseBtn}
              aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
              title={open ? "Collapse" : "Expand"}
            >
              {open ? "⟨" : "⟩"}
            </button>
          </div>

          <div style={{ marginTop: 18 }}>
            {links.map((link) => {
              const active = location.pathname === link.path

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    ...item,
                    padding: open ? "10px 12px" : "10px 10px",
                    justifyContent: open ? "flex-start" : "center",
                    borderColor: active ? "rgba(20,92,67,0.28)" : "rgba(0,0,0,0.06)",
                    background: active
                      ? "rgba(20,92,67,0.10)"
                      : "transparent",
                    color: active ? "#0f3d2e" : "rgba(0,0,0,0.70)"
                  }}
                >
                  <span style={dotIcon(active)} />
                  {open ? <span style={itemText}>{link.label}</span> : null}
                </Link>
              )
            })}
          </div>

          {open ? (
            <div style={foot}>
              <div style={footHint}>Apple-style UI</div>
              <div style={footSub}>Manrope • subtle radius • clean glass</div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

/* =========================
   STYLES
========================= */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.18)",
  zIndex: 30,
  display: "none"
}

// Mostramos overlay solo en <= 1024px
// (sin CSS file, lo resolvemos con un truco: lo dejamos en display none, y el wrapper usa fixed ahí)
const sidebarWrapper = {
  padding: "18px 14px",
  display: "flex",
  justifyContent: "center",
  transition: "width 220ms ease",
  zIndex: 40
}

const sidebar = {
  height: "calc(100vh - 36px)",
  padding: "14px 12px",
  borderRadius: 16, // ✅ sutil (antes 32)
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(26px)",
  WebkitBackdropFilter: "blur(26px)",
  border: "1px solid rgba(255,255,255,0.55)",
  boxShadow: "0 10px 30px rgba(15,61,46,0.10)", // ✅ menos caricatura
  transition: "width 220ms ease",
  overflow: "hidden"
}

const top = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10
}

const logoMark = {
  width: 14,
  height: 14,
  borderRadius: 6,
  background: "linear-gradient(135deg, rgba(20,92,67,0.95), rgba(30,122,87,0.80))"
}

const logoText = {
  fontSize: 14, // ✅ más chico
  fontWeight: 900,
  color: "#0f3d2e",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const collapseBtn = {
  width: 32,
  height: 30,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.65)",
  cursor: "pointer",
  fontWeight: 900,
  color: "rgba(0,0,0,0.70)"
}

const item = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 10,
  borderRadius: 14, // ✅ sutil
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 800,
  border: "1px solid rgba(0,0,0,0.06)",
  transition: "all 160ms ease"
}

const itemText = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
}

const dotIcon = (active) => ({
  width: 10,
  height: 10,
  borderRadius: 5,
  background: active ? "rgba(20,92,67,0.95)" : "rgba(0,0,0,0.20)"
})

const foot = {
  marginTop: 16,
  paddingTop: 12,
  borderTop: "1px solid rgba(0,0,0,0.06)"
}

const footHint = {
  fontSize: 12,
  fontWeight: 900,
  color: "rgba(0,0,0,0.55)"
}

const footSub = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "rgba(0,0,0,0.40)"
}
