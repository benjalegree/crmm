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
                  ? "linear-gradient(135deg,#145c43,#1e7a57)"
                  : "transparent",
                color: active ? "#ffffff" : "#145c43",
                boxShadow: active
                  ? "0 8px 25px rgba(20,92,67,0.35)"
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
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(20px)",
  borderRight: "1px solid rgba(255,255,255,0.4)"
}

const logo = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#0f3d2e"
}

const item = {
  display: "block",
  padding: "14px 18px",
  marginBottom: "14px",
  borderRadius: "18px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.25s ease"
}
