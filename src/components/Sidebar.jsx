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
                  ? "linear-gradient(135deg, #007aff, #5ac8fa)"
                  : "transparent",
                color: active ? "#fff" : "#1c1c1e",
                boxShadow: active
                  ? "0 10px 25px rgba(0,122,255,0.35)"
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
  backdropFilter: "blur(40px)",
  background: "rgba(255,255,255,0.4)",
  borderRadius: "32px",
  padding: "45px 30px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
  border: "1px solid rgba(255,255,255,0.8)"
}

const logo = {
  fontSize: "22px",
  fontWeight: "700",
  letterSpacing: "-0.5px"
}

const item = {
  display: "block",
  padding: "16px 22px",
  marginBottom: "16px",
  borderRadius: "20px",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: "500",
  transition: "all 0.3s ease"
}
