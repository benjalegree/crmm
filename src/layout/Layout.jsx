import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  return (
    <div style={background}>
      <div style={wrapper}>
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
    linear-gradient(180deg, #f4f5f7 0%, #eceef1 100%)
  `,
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif",
  padding: "60px 80px"
}

const wrapper = {
  display: "flex",
  gap: "48px"
}

const main = {
  flex: 1,
  backdropFilter: "blur(40px)",
  background: "rgba(255,255,255,0.65)",
  borderRadius: "28px",
  padding: "60px",
  boxShadow: "0 30px 60px rgba(0,0,0,0.06)",
  border: "1px solid rgba(255,255,255,0.8)"
}
