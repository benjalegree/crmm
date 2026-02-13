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
  minHeight: "100vh",
  background: "#f6f9ff",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const content = {
  flex: 1,
  padding: "60px 80px"
}
