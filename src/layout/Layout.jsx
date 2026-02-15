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
      padding: isMobile ? "90px 16px 22px" : "36px 44px 28px"
    }
  }, [isMobile])

  return (
    <div style={styles.app}>
      <Sidebar
        isMobile={isMobile}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
      />

      {/* Topbar (siempre visible, en desktop actúa como header premium) */}
      <div style={{ ...styles.topbar, ...(isMobile ? styles.topbarMobile : styles.topbarDesktop) }}>
        <div style={styles.topbarLeft}>
          {isMobile ? (
            <button
              type="button"
              style={styles.iconBtn}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              title="Menu"
            >
              <IconMenu />
            </button>
          ) : (
            <div style={styles.brand}>
              <div style={styles.brandMark} />
              <div style={styles.brandTextWrap}>
                <div style={styles.brandTitle}>PsicoFunnel</div>
                <div style={styles.brandSub}>CRM</div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.topbarCenter}>
          <div style={styles.topbarPill}>
            <span style={styles.pillDot} />
            <span style={styles.pillText}>Premium workspace</span>
          </div>
        </div>

        <div style={styles.topbarRight}>
          {/* Placeholder acciones futuras */}
          <button type="button" style={styles.ghostBtn} aria-label="Quick actions" title="Quick actions">
            <IconSpark />
          </button>
          <div style={styles.avatar} title="Account">
            PF
          </div>
        </div>
      </div>

      <div style={contentStyle}>{children}</div>
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

/* ===================== STYLES (PsicoFunnel premium) ===================== */

const FONT = "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"

// Verde inglés notorio (base)
const GREEN = "#0f4d3a"       // inglés profundo
const GREEN_2 = "#12694c"     // acento
const GREEN_SOFT = "rgba(18,105,76,0.10)"
const BORDER = "rgba(15,77,58,0.14)"
const TEXT = "#0b1a14"

const styles = {
  app: {
    position: "relative",
    display: "flex",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    fontFamily: FONT,
    color: TEXT,
    background: "#ffffff"
  },

  // Header premium tipo  pero con verde PsicoFunnel
  topbar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 72,
    zIndex: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 18px",
    background: `
      linear-gradient(180deg, rgba(18,105,76,0.92) 0%, rgba(18,105,76,0.88) 55%, rgba(18,105,76,0.82) 100%)
    `,
    borderBottom: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 18px 40px rgba(15,77,58,0.22)"
  },

  topbarMobile: {
    padding: "0 14px"
  },

  topbarDesktop: {
    padding: "0 22px"
  },

  topbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 220
  },

  topbarCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },

  topbarRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    minWidth: 220
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },

  brandMark: {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: "rgba(255,255,255,0.95)",
    boxShadow: "0 10px 18px rgba(0,0,0,0.18)"
  },

  brandTextWrap: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1
  },

  brandTitle: {
    fontSize: 15,
    fontWeight: 950,
    letterSpacing: 0.2,
    color: "#ffffff"
  },

  brandSub: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: 850,
    color: "rgba(255,255,255,0.78)"
  },

  topbarPill: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)"
  },

  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.95)"
  },

  pillText: {
    fontSize: 12,
    fontWeight: 900,
    color: "rgba(255,255,255,0.92)",
    letterSpacing: 0.2
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer"
  },

  ghostBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer"
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
    border: "1px solid rgba(255,255,255,0.35)",
    boxShadow: "0 12px 26px rgba(0,0,0,0.18)"
  },

  content: {
    flex: 1,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    paddingTop: 86,
    background: `
      linear-gradient(180deg, rgba(18,105,76,0.08) 0%, rgba(255,255,255,1) 200px),
      #ffffff
    `
  }
}
