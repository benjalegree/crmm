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
                  ? "rgba(0,0,0,0.8)"
                  : "transparent",
                color: active ? "#fff" : "#1c1c1e"
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
  backdropFilter: "blur(30px)",
  background: "rgba(255, 255, 255, 0.6)",
  borderRadius: "28px",
  padding: "40px 25px",
  boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
  border: "1px solid rgba(255,255,255,0.6)"
}

const logo = {
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "-0.5px"
}

const item = {
  display: "block",
  padding: "14px 18px",
  marginBottom: "12px",
  borderRadius: "16px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "500",
  transition: "all 0.25s ease"
}
