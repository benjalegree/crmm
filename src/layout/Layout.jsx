import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"

export default function Layout({ children }) {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 1024 // iPad y abajo
      setIsMobile(mobile)
      setSidebarOpen(!mobile) // mobile cerrado, desktop abierto
    }
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const contentStyle = useMemo(() => {
    return {
      ...styles.content,
      padding: isMobile ? "96px 16px 24px" : "96px 40px 28px"
    }
  }, [isMobile])

  return (
    <div style={styles.app}>
      {/* Topbar global */}
      <header style={styles.topbar}>
        <div style={styles.topLeft}>
          {isMobile ? (
            <button
              type="button"
              style={styles.topIconBtn}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              title="Menu"
            >
              <IconMenu />
            </button>
          ) : (
            <div style={styles.brand}>
              <span style={styles.brandDot} />
              <div style={styles.brandText}>
                <div style={styles.brandTitle}>PsicoFunnel</div>
                <div style={styles.brandSub}>CRM</div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.topCenter}>
          <div style={styles.centerPill}>
            <span style={styles.centerPillDot} />
            <span style={styles.centerPillText}>Workspace</span>
          </div>
        </div>

        <div style={styles.topRight}>
          <button type="button" style={styles.topIconBtn} aria-label="Quick actions" title="Quick actions">
            <IconSpark />
          </button>
          <div style={styles.avatar} title="Account">
            PF
          </div>
        </div>
      </header>

      <Sidebar
        isMobile={isMobile}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />

      <main style={contentStyle}>{children}</main>
    </div>
  )
}

/* ===================== ICONS ===================== */

function IconMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
function IconSpark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.6 6.2L20 10l-6.4 1.8L12 18l-1.6-6.2L4 10l6.4-1.8L12 2z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ===================== THEME ===================== */

const FONT = "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"

// Verde inglés (notorio, premium)
const GREEN = "#0E4B39"
const GREEN2 = "#0A3A2C"
const WHITE = "#FFFFFF"
const INK = "#0B1511"
const MUTED = "rgba(11,21,17,0.58)"
const BORDER = "rgba(14,75,57,0.14)"
const SHADOW = "0 18px 50px rgba(14,75,57,0.14)"

const styles = {
  app: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    overflow: "hidden",
    background: WHITE,
    fontFamily: FONT,
    color: INK
  },

  topbar: {
    position: "fixed",
    inset: "0 0 auto 0",
    height: 76,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px",
    background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN2} 100%)`,
    borderBottom: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.22)"
  },

  topLeft: { display: "flex", alignItems: "center", gap: 12, minWidth: 220 },
  topCenter: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" },
  topRight: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, minWidth: 220 },

  brand: { display: "flex", alignItems: "center", gap: 12 },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 10px 18px rgba(0,0,0,0.20)"
  },
  brandText: { display: "flex", flexDirection: "column", lineHeight: 1 },
  brandTitle: { fontSize: 15, fontWeight: 950, color: "#fff", letterSpacing: 0.2 },
  brandSub: { marginTop: 3, fontSize: 11, fontWeight: 850, color: "rgba(255,255,255,0.74)" },

  centerPill: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)"
  },
  centerPillDot: { width: 7, height: 7, borderRadius: 999, background: "rgba(255,255,255,0.92)" },
  centerPillText: { fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.92)", letterSpacing: 0.2 },

  topIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    transition: "transform .12s ease"
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 12,
    color: GREEN,
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(255,255,255,0.28)",
    boxShadow: "0 12px 26px rgba(0,0,0,0.18)"
  },

  content: {
    flex: 1,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    background: `
      radial-gradient(circle at 18% 6%, rgba(14,75,57,0.08), transparent 42%),
      radial-gradient(circle at 84% 14%, rgba(14,75,57,0.06), transparent 42%),
      ${WHITE}
    `
  }
}
