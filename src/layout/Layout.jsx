import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  return (
    <div style={background}>
      <div style={shell}>
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
    linear-gradient(180deg, #f9fbff 0%, #eef4ff 100%)
  `,
  padding: "60px 80px",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
}

const shell = {
  display: "flex",
  gap: "50px",
  maxWidth: "1500px",
  margin: "0 auto"
}

const main = {
  flex: 1,
  background: "white",
  borderRadius: "22px",
  padding: "60px",
  boxShadow: "0 25px 60px rgba(37,99,235,0.08)"
}
