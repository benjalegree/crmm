import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  return (
    <div style={background}>
      <div style={windowShell}>
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
  background: "#e9eaee",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "60px",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const windowShell = {
  width: "100%",
  maxWidth: "1500px",
  display: "flex",
  gap: "40px",
  background: "#f7f8fa",
  borderRadius: "32px",
  padding: "40px",
  boxShadow: `
    0 40px 80px rgba(0,0,0,0.08),
    0 10px 20px rgba(0,0,0,0.04)
  `
}

const main = {
  flex: 1,
  background: "white",
  borderRadius: "24px",
  padding: "60px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.05)"
}
