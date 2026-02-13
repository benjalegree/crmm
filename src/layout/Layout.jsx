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
    radial-gradient(circle at 50% -10%, rgba(0,122,255,0.25), transparent 50%),
    radial-gradient(circle at 90% 40%, rgba(0,255,200,0.18), transparent 50%),
    linear-gradient(180deg, #f2f5fa 0%, #e7edf6 100%)
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
  background: "rgba(255,255,255,0.40)",
  borderRadius: "34px",
  padding: "60px",
  boxShadow: "0 30px 80px rgba(0,0,0,0.10)",
  border: "1px solid rgba(255,255,255,0.9)"
}
