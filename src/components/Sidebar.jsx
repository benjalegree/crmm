import { Link, useLocation } from "react-router-dom"
import { useMemo } from "react"

export default function Sidebar({ isMobile, open, onToggle, onClose, onOpen }) {
  const location = useLocation()

  const links = [
    { path: "/dashboard", label: "Overview", icon: IconGrid },
    { path: "/companies", label: "Companies", icon: IconBuilding },
    { path: "/leads", label: "Leads", icon: IconUser },
    { path: "/pipeline", label: "Pipeline", icon: IconKanban },
    { path: "/calendar", label: "Calendar", icon: IconCalendar }
  ]

  const isCollapsedDesktop = !isMobile && !open

  const wrapperStyle = useMemo(() => {
    if (isMobile) {
      return {
        ...styles.wrapperMobile,
        transform: open ? "translateX(0)" : "translateX(-112%)"
      }
    }
    return {
      ...styles.wrapper,
      width: isCollapsedDesktop ? 104 : 320
    }
  }, [isMobile, open, isCollapsedDesktop])

  const panelStyle = useMemo(() => {
    if (isMobile) return styles.panelMobile
    return {
      ...styles.panel,
      width: isCollapsedDesktop ? 86 : 280,
      padding: isCollapsedDesktop ? "18px 10px" : "18px 16px"
    }
  }, [isMobile, isCollapsedDesktop])

  return (
    <>
      {isMobile && open ? <div style={styles.overlay} onClick={onClose} aria-hidden="true" /> : null}

      <div style={wrapperStyle}>
        <div style={panelStyle}>
          {/* Header interno sidebar */}
          <div style={styles.sideHead}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={styles.sideMark} />
              {!isCollapsedDesktop ? (
                <div style={{ minWidth: 0 }}>
                  <div style={styles.sideTitle}>PsicoFunnel</div>
                  <div style={styles.sideSub}>Workspace</div>
                </div>
              ) : null}
            </div>

            {isMobile ? (
              <button type="button" style={styles.sideBtn} onClick={onClose} aria-label="Close menu">
                <span style={styles.sideBtnGlyph}>×</span>
              </button>
            ) : (
              <button
                type="button"
                style={styles.sideBtn}
                onClick={() => (isCollapsedDesktop ? onOpen?.() : onToggle?.())}
                aria-label="Toggle sidebar"
                title={isCollapsedDesktop ? "Expand" : "Collapse"}
              >
                <span style={styles.sideBtnGlyph}>{isCollapsedDesktop ? "→" : "←"}</span>
              </button>
            )}
          </div>

          {/* Nav */}
          <div style={{ marginTop: 12 }}>
            {links.map((link) => {
              const active = location.pathname === link.path
              const Icon = link.icon

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => {
                    if (isMobile) onClose?.()
                  }}
                  style={{
                    ...styles.item,
                    ...(isCollapsedDesktop ? styles.itemCollapsed : null),
                    ...(active ? styles.itemActive : null)
                  }}
                >
                  <span style={{ ...styles.iconBox, ...(active ? styles.iconBoxActive : null) }}>
                    <Icon active={active} />
                  </span>

                  {!isCollapsedDesktop ? <span style={styles.itemLabel}>{link.label}</span> : null}

                  {!isCollapsedDesktop ? (
                    <span style={{ ...styles.activePip, opacity: active ? 1 : 0 }} />
                  ) : null}
                </Link>
              )
            })}
          </div>

          {/* Footer */}
          {!isCollapsedDesktop ? (
            <div style={styles.footer}>
              <div style={styles.footerTop}>
                <span style={styles.footerDot} />
                <div style={styles.footerTitle}>English Green System</div>
              </div>
              <div style={styles.footerText}>Minimal, fast, and made to feel good to work.</div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

/* ===================== ICONS ===================== */

function IconGrid({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
        stroke={active ? "#ffffff" : "currentColor"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconBuilding({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 20V4h12v16M9 8h2m-2 4h2m-2 4h2m4-8h2m-2 4h2m-2 4h2M4 20h16"
        stroke={active ? "#ffffff" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconUser({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 21a8 8 0 10-16 0M12 13a4.5 4.5 0 100-9 4.5 4.5 0 000 9z"
        stroke={active ? "#ffffff" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconKanban({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
        stroke={active ? "#ffffff" : "currentColor"}
        strokeWidth="2"
      />
      <path d="M8 8v8M12 8v6M16 8v10" stroke={active ? "#ffffff" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconCalendar({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M4 8h16M6 6h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z"
        stroke={active ? "#ffffff" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M8 12h4M8 16h7" stroke={active ? "#ffffff" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* ===================== STYLES ===================== */

const FONT = "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"
const GREEN = "#0f4d3a"
const GREEN_2 = "#12694c"
const GREEN_SOFT = "rgba(18,105,76,0.10)"
const BORDER = "rgba(15,77,58,0.14)"
const TEXT = "#0b1a14"

const styles = {
  wrapper: {
    padding: "96px 14px 16px", // deja visible el topbar verde
    display: "flex",
    justifyContent: "center",
    transition: "width 0.22s ease"
  },

  wrapperMobile: {
    position: "fixed",
    top: 72,
    left: 0,
    bottom: 0,
    width: 340,
    padding: "14px",
    zIndex: 90,
    transition: "transform 0.22s ease"
  },

  overlay: {
    position: "fixed",
    top: 72,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.28)",
    backdropFilter: "blur(3px)",
    WebkitBackdropFilter: "blur(3px)",
    zIndex: 85
  },

  panel: {
    height: "100%",
    borderRadius: 22,
    background: "#ffffff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 26px 60px rgba(15,77,58,0.14)",
    display: "flex",
    flexDirection: "column",
    fontFamily: FONT
  },

  panelMobile: {
    height: "100%",
    borderRadius: 22,
    background: "#ffffff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 26px 60px rgba(15,77,58,0.16)",
    display: "flex",
    flexDirection: "column",
    fontFamily: FONT,
    padding: "18px 16px"
  },

  sideHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "14px 12px 12px"
  },

  sideMark: {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: `linear-gradient(135deg, ${GREEN_2}, ${GREEN})`,
    boxShadow: "0 12px 22px rgba(15,77,58,0.22)"
  },

  sideTitle: {
    fontSize: 14,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: 0.2
  },

  sideSub: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: 800,
    color: "rgba(0,0,0,0.55)"
  },

  sideBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: "#ffffff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(15,77,58,0.10)"
  },

  sideBtnGlyph: {
    fontWeight: 950,
    color: TEXT,
    lineHeight: 1
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 12px",
    margin: "0 10px 10px",
    borderRadius: 16,
    textDecoration: "none",
    border: "1px solid transparent",
    transition: "all 0.12s ease"
  },

  itemCollapsed: {
    justifyContent: "center",
    margin: "0 8px 10px",
    padding: "12px 10px"
  },

  itemActive: {
    background: `linear-gradient(135deg, ${GREEN_2} 0%, ${GREEN} 100%)`,
    borderColor: "rgba(0,0,0,0.06)",
    boxShadow: "0 18px 40px rgba(15,77,58,0.26)"
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: GREEN_SOFT,
    border: `1px solid ${BORDER}`,
    color: GREEN
  },

  iconBoxActive: {
    background: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.22)",
    color: "#ffffff"
  },

  itemLabel: {
    fontSize: 13,
    fontWeight: 950,
    color: TEXT,
    letterSpacing: 0.1
  },

  activePip: {
    marginLeft: "auto",
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.90)",
    boxShadow: "0 10px 16px rgba(0,0,0,0.18)",
    transition: "opacity 0.12s ease"
  },

  footer: {
    marginTop: "auto",
    padding: "14px 14px 16px",
    borderTop: `1px solid ${BORDER}`
  },

  footerTop: {
    display: "flex",
    alignItems: "center",
    gap: 10
  },

  footerDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: `linear-gradient(135deg, ${GREEN_2}, ${GREEN})`
  },

  footerTitle: {
    fontSize: 12,
    fontWeight: 950,
    color: GREEN,
    letterSpacing: 0.2,
    textTransform: "uppercase"
  },

  footerText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 750,
    color: "rgba(0,0,0,0.58)",
    lineHeight: 1.35
  }
}
