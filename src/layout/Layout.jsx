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
  overflow: "hidden",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif",
  background: `
    radial-gradient(circle at 20% 20%, rgba(30,122,87,0.12), transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(15,61,46,0.12), transparent 40%),
    linear-gradient(135deg, #f4fbf8 0%, #e8f5ef 50%, #f4fbf8 100%)
  `
}

const content = {
  flex: 1,
  padding: "60px 80px",
  overflowY: "auto"
}
