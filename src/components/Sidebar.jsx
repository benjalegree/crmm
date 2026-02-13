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
                background: active ? "#2563eb" : "transparent",
                color: active ? "#fff" : "#6b7280",
                boxShadow: active
                  ? "0 8px 20px rgba(37,99,235,0.25)"
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
  width: "260px",
  padding: "50px 30px",
  background: "white",
  borderRight: "1px solid #e5e7eb"
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
  borderRadius: "14px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "500",
  transition: "all 0.2s ease"
}
