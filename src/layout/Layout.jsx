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
    radial-gradient(circle at 20% 20%, rgba(120, 180, 255, 0.15), transparent 40%),
    radial-gradient(circle at 80% 30%, rgba(150, 255, 200, 0.12), transparent 40%),
    radial-gradient(circle at 50% 80%, rgba(200, 180, 255, 0.12), transparent 50%),
    #f7f8fa
  `,
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif",
  padding: "40px"
}

const container = {
  display: "flex",
  gap: "30px"
}

const main = {
  flex: 1,
  backdropFilter: "blur(30px)",
  background: "rgba(255, 255, 255, 0.55)",
  borderRadius: "28px",
  padding: "50px",
  boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
  border: "1px solid rgba(255,255,255,0.6)"
}
