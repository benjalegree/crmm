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
    <div style={sidebarWrapper}>
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
                    ? "rgba(20,92,67,0.8)"
                    : "transparent",
                  color: active ? "#ffffff" : "#0f3d2e",
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
    </div>
  )
}

const sidebarWrapper = {
  width: "300px",
  padding: "40px 20px",
  display: "flex",
  justifyContent: "center"
}

const sidebar = {
  width: "260px",
  height: "100%",
  padding: "40px 25px",
  borderRadius: "32px",
  background: "rgba(255,255,255,0.35)",
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.4)",
  boxShadow: "0 30px 60px rgba(15,61,46,0.15)"
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
