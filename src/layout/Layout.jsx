import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  return (
    <div style={background}>
      <div style={container}>
        <Sidebar />
        <div style={main}>
          {children}
        </div>
      </div>
    </div>
  )
}

const background = {
  minHeight: "100vh",
  background: `
    radial-gradient(circle at 70% 20%, rgba(0,122,255,0.12), transparent 40%),
    radial-gradient(circle at 20% 80%, rgba(120,100,255,0.12), transparent 40%),
    linear-gradient(180deg, #f7f9fc 0%, #eef2f8 100%)
  `,
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif",
  padding: "60px"
}

const container = {
  display: "flex",
  gap: "40px"
}

const main = {
  flex: 1,
  backdropFilter: "blur(40px)",
  background: "rgba(255,255,255,0.45)",
  borderRadius: "32px",
  padding: "60px",
  boxShadow: "0 25px 60px rgba(0,0,0,0.08)",
  border: "1px solid rgba(255,255,255,0.9)"
}
