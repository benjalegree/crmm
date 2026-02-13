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
                background: active ? "#111" : "transparent",
                color: active ? "#fff" : "#6e6e73"
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
  width: "230px",
  background: "white",
  borderRadius: "24px",
  padding: "40px 25px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.05)"
}

const logo = {
  fontSize: "20px",
  fontWeight: "700"
}

const item = {
  display: "block",
  padding: "12px 18px",
  marginBottom: "14px",
  borderRadius: "14px",
  textDecoration: "none",
  fontSize: "14px",
  transition: "all 0.2s ease"
}
