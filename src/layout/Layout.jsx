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
    radial-gradient(circle at 15% 20%, rgba(0,122,255,0.25), transparent 40%),
    radial-gradient(circle at 85% 30%, rgba(0,255,180,0.25), transparent 40%),
    radial-gradient(circle at 50% 85%, rgba(160,100,255,0.25), transparent 50%),
    linear-gradient(135deg, #f3f6fb, #eef2f8)
  `,
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif",
  padding: "50px"
}

const container = {
  display: "flex",
  gap: "40px"
}

const main = {
  flex: 1,
  backdropFilter: "blur(40px)",
  background: "rgba(255,255,255,0.35)",
  borderRadius: "32px",
  padding: "60px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
  border: "1px solid rgba(255,255,255,0.8)"
}
