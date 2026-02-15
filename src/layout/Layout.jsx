import { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  const [sidebarHidden, setSidebarHidden] = useState(false)

  // iPad / pantallas chicas: arranca oculto para dar espacio (pero en PC también podés toggle)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth <= 980) setSidebarHidden(true)
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return (
    <div style={app}>
      <Sidebar hidden={sidebarHidden} onToggle={() => setSidebarHidden(v => !v)} />

      <div
        style={{
          ...content,
          // 🔥 NO cambio tamaños: solo compenso el ancho del sidebar cuando está visible
          marginLeft: sidebarHidden ? 0 : 300
        }}
      >
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
  padding: "60px 80px",          // ✅ EXACTO como estaba
  overflowY: "auto",
  transition: "margin-left 240ms ease"
}
