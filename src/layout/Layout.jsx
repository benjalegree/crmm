import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  // Auto-colapsa en pantallas chicas (iPad), pero en desktop se puede toggle igual
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      if (w <= 980) setCollapsed(true)
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const sidebarWidth = collapsed ? 88 : 280

  const contentStyle = useMemo(
    () => ({
      ...content,
      padding: collapsed ? "44px 34px" : "52px 56px"
    }),
    [collapsed]
  )

  return (
    <div style={app}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

      <div
        style={{
          ...shell,
          paddingLeft: sidebarWidth
        }}
      >
        <div style={contentStyle}>{children}</div>
      </div>
    </div>
  )
}

const app = {
  position: "relative",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif",
  background: `
    radial-gradient(circle at 10% 10%, rgba(30,122,87,0.18), transparent 42%),
    radial-gradient(circle at 90% 90%, rgba(15,61,46,0.16), transparent 44%),
    linear-gradient(135deg, #f4fbf8 0%, #e9f6f0 50%, #f4fbf8 100%)
  `
}

// “capa” para permitir sidebar fixed y contenido fluido
const shell = {
  position: "relative",
  height: "100%",
  width: "100%",
  overflow: "hidden",
  transition: "padding-left 280ms cubic-bezier(.2,.8,.2,1)"
}

const content = {
  height: "100%",
  overflowY: "auto",
  transition: "padding 280ms cubic-bezier(.2,.8,.2,1)"
}
