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
    radial-gradient(circle at 50% -20%, rgba(255,255,255,0.08), transparent 50%),
    linear-gradient(180deg, #1c1c1e 0%, #111113 100%)
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
  backdropFilter: "blur(50px)",
  background: "rgba(255,255,255,0.08)",
  borderRadius: "36px",
  padding: "60px",
  boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "white"
}
