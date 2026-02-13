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

      <div style={{ marginTop: "50px" }}>
        {links.map(link => {
          const active = location.pathname === link.path

          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                ...item,
                background: active
                  ? "linear-gradient(135deg,#2563eb,#3b82f6)"
                  : "transparent",
                color: active ? "white" : "#4b5563",
                boxShadow: active
                  ? "0 10px 25px rgba(37,99,235,0.25)"
                  : "none"
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
  background: "white",
  borderRadius: "20px",
  padding: "40px 28px",
  boxShadow: "0 20px 40px rgba(37,99,235,0.05)"
}

const logo = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#111827"
}

const item = {
  display: "block",
  padding: "14px 18px",
  marginBottom: "14px",
  borderRadius: "16px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "500",
  transition: "all 0.2s ease"
}
