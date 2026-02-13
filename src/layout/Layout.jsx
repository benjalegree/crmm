import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  return (
    <div style={app}>
      <Sidebar />
      <div style={content}>
        {children}
      </div>
    </div>
  )
}

const app = {
  display: "flex",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif",
  background: `
    radial-gradient(circle at 10% 10%, rgba(30,122,87,0.18), transparent 40%),
    radial-gradient(circle at 90% 90%, rgba(15,61,46,0.18), transparent 40%),
    linear-gradient(135deg, #f4fbf8 0%, #e9f6f0 50%, #f4fbf8 100%)
  `
}

const content = {
  flex: 1,
  padding: "60px 80px",
  overflowY: "auto"
}
