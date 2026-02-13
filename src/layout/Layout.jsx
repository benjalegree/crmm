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
  background: "#f5f5f7",
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
  background: "rgba(255,255,255,0.65)",
  borderRadius: "36px",
  padding: "60px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.06)",
  border: "1px solid rgba(255,255,255,0.9)"
}
