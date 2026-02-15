import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"

const T = {
  bg: "#F6FBF8",
  bg2: "#EEF6F1",
  ink: "#0F2E24",
  line: "rgba(15,46,36,0.10)",
  surfaceTopbar: "rgba(246,251,248,0.78)"
}

export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 1024
      setIsMobile(mobile)
      setSidebarOpen(!mobile) // desktop abierto, mobile cerrado
    }

    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const contentStyle = useMemo(() => {
    return {
      ...content,
      padding: isMobile ? "84px 16px 22px" : "28px 36px"
    }
  }, [isMobile])

  return (
    <div style={app}>
      <Sidebar
        isMobile={isMobile}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />

      {isMobile ? (
        <div style={mobileTopbar}>
          <button
            type="button"
            style={burgerBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div style={topbarTitle}>PsicoFunnel CRM</div>
          <div style={{ width: 44 }} />
        </div>
      ) : null}

      <div style={contentStyle}>{children}</div>
    </div>
  )
}

const app = {
  position: "relative",
  display: "flex",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, sans-serif",
  background: `
    radial-gradient(900px 700px at 12% 10%, rgba(20,92,67,0.12), transparent 55%),
    radial-gradient(900px 700px at 88% 90%, rgba(15,61,46,0.10), transparent 55%),
    linear-gradient(180deg, ${T.bg} 0%, ${T.bg2} 100%)
  `
}

const content = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden"
}

const mobileTopbar = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: 64,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 12px",
  zIndex: 50,
  background: T.surfaceTopbar,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderBottom: `1px solid ${T.line}`
}

const burgerBtn = {
  width: 44,
  height: 44,
  borderRadius: 12,
  border: `1px solid ${T.line}`,
  background: "rgba(255,255,255,0.86)",
  boxShadow: "0 10px 24px rgba(15,46,36,0.08)",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 18,
  color: T.ink
}

const topbarTitle = {
  fontSize: 13,
  fontWeight: 900,
  color: T.ink,
  letterSpacing: 0.2
}
