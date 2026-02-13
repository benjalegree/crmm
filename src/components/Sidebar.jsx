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
                  ? "rgba(255,255,255,0.15)"
                  : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.6)",
                border: active
                  ? "1px solid rgba(255,255,255,0.2)"
                  : "1px solid transparent"
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
  width: "260px",
  backdropFilter: "blur(50px)",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "36px",
  padding: "50px 30px",
  boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "white"
}

const logo = {
  fontSize: "22px",
  fontWeight: "700",
  letterSpacing: "-0.5px"
}

const item = {
  display: "block",
  padding: "16px 22px",
  marginBottom: "18px",
  borderRadius: "20px",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: "500",
  transition: "all 0.3s ease"
}
