import { Link, useLocation } from "react-router-dom"

export default function Sidebar() {
  const location = useLocation()

  const links = [
    { path: "/dashboard", label: "Overview" },
    { path: "/companies", label: "Companies" },
    { path: "/leads", label: "Leads" },
    { path: "/pipeline", label: "Pipeline" },
    { path: "/calendar", label: "Calendar" },
    { path: "/profile", label: "Profile" }
  ]

  return (
    <div style={sidebar}>
      <h2 style={{marginBottom:"40px"}}>PsicoFunnel CRM</h2>
      {links.map(link => (
        <Link
          key={link.path}
          to={link.path}
          style={{
            ...item,
            background:
              location.pathname === link.path
                ? "#000"
                : "transparent",
            color:
              location.pathname === link.path
                ? "#fff"
                : "#333"
          }}
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}

const sidebar = {
  width: "240px",
  background: "#ffffff",
  padding: "30px",
  boxShadow: "5px 0 20px rgba(0,0,0,0.05)"
}

const item = {
  display: "block",
  padding: "12px 16px",
  marginBottom: "10px",
  borderRadius: "10px",
  textDecoration: "none",
  transition: "all 0.2s ease"
}
