import { Link, useLocation } from "react-router-dom"

export default function Sidebar() {
  const location = useLocation()

  const links = [
    { path: "/dashboard", label: "Overview" },
    { path: "/companies", label: "Companies" },
    { path: "/leads", label: "Leads" },
    { path: "/pipeline", label: "Pipeline" },
    { path: "/calendar", label: "Calendar" }
  ]

  return (
    <div style={sidebar}>
      <div style={logo}>PsicoFunnel</div>

      <div style={{ marginTop: "60px" }}>
        {links.map(link => {
          const active = location.pathname === link.path

          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                ...item,
                background: active
                  ? "rgba(0,0,0,0.06)"
                  : "transparent",
                color: active ? "#111" : "#6e6e73",
                fontWeight: active ? "600" : "500"
              }}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

const sidebar = {
  width: "240px",
  backdropFilter: "blur(40px)",
  background: "rgba(255,255,255,0.6)",
  borderRadius: "28px",
  padding: "50px 30px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.05)",
  border: "1px solid rgba(255,255,255,0.8)"
}

const logo = {
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "-0.3px"
}

const item = {
  display: "block",
  padding: "14px 18px",
  marginBottom: "16px",
  borderRadius: "14px",
  textDecoration: "none",
  fontSize: "14px",
  transition: "all 0.2s ease"
}
