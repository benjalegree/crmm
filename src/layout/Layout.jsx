import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  return (
    <div style={container}>
      <Sidebar />
      <div style={main}>
        {children}
      </div>
    </div>
  )
}

const container = {
  display: "flex",
  height: "100vh",
  background: "#f5f5f7",
  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
}

const main = {
  flex: 1,
  padding: "40px",
  overflowY: "auto"
}
