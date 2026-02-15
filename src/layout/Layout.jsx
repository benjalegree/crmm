import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  // Auto-collapse en pantallas chicas (iPad)
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      if (w < 1100) setCollapsed(true)
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return (
    <div style={app}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((s) => !s)} />

      <main
        style={{
          ...content,
          paddingLeft: collapsed ? 26 : 8
        }}
      >
        {children}
      </main>
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
    radial-gradient(circle at 15% 10%, rgba(30,122,87,0.10), transparent 45%),
    radial-gradient(circle at 85% 90%, rgba(15,61,46,0.10), transparent 45%),
    linear-gradient(180deg, #f6fbf8 0%, #eef7f2 55%, #f6fbf8 100%)
  `
}

const content = {
  flex: 1,
  padding: "56px 64px",
  overflowY: "auto",
  boxSizing: "border-box"
}
