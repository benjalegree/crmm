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
        ...S.wrapperMobile,
        transform: open ? "translateX(0)" : "translateX(-112%)"
      }
    }
    return {
      ...S.wrapper,
      width: isCollapsedDesktop ? 104 : 330
    }
  }, [isMobile, open, isCollapsedDesktop])

  const panelStyle = useMemo(() => {
    if (isMobile) return S.panelMobile
    return {
      ...S.panel,
      width: isCollapsedDesktop ? 86 : 290,
      padding: isCollapsedDesktop ? "16px 10px" : "16px 14px"
    }
  }, [isMobile, isCollapsedDesktop])

  return (
    <>
      {isMobile && open ? <div style={S.overlay} onClick={onClose} aria-hidden="true" /> : null}

      <div style={wrapperStyle}>
        <aside style={panelStyle}>
          <div style={S.head}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={S.mark} />
              {!isCollapsedDesktop ? (
                <div style={{ minWidth: 0 }}>
                  <div style={S.title}>PsicoFunnel</div>
                  <div style={S.sub}>Navigation</div>
                </div>
              ) : null}
            </div>

            {isMobile ? (
              <button type="button" style={S.ctrlBtn} onClick={onClose} aria-label="Close menu">
                ×
              </button>
            ) : (
              <button
                type="button"
                style={S.ctrlBtn}
                onClick={() => (isCollapsedDesktop ? onOpen?.() : onToggle?.())}
                aria-label="Toggle sidebar"
                title={isCollapsedDesktop ? "Expand" : "Collapse"}
              >
                {isCollapsedDesktop ? "→" : "←"}
              </button>
            )}
          </div>

          <nav style={{ marginTop: 10 }}>
            {links.map((l) => {
              const active = location.pathname === l.path
              const Icon = l.icon

              return (
                <Link
                  key={l.path}
                  to={l.path}
                  onClick={() => {
                    if (isMobile) onClose?.()
                  }}
                  style={{
                    ...S.item,
                    ...(isCollapsedDesktop ? S.itemCollapsed : null),
                    ...(active ? S.itemActive : null)
                  }}
                >
                  <span style={{ ...S.iconBox, ...(active ? S.iconBoxActive : null) }}>
                    <Icon active={active} />
                  </span>

                  {!isCollapsedDesktop ? <span style={{ ...S.label, ...(active ? S.labelActive : null) }}>{l.label}</span> : null}

                  {!isCollapsedDesktop ? <span style={{ ...S.pip, opacity: active ? 1 : 0 }} /> : null}
                </Link>
              )
            })}
          </nav>

          {!isCollapsedDesktop ? (
            <div style={S.footer}>
              <div style={S.footerLine} />
              <div style={S.footerTitle}>Clean • Minimal • Fast</div>
              <div style={S.footerText}>White base + English Green accents. Built for focus.</div>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  )
}

/* ================= ICONS ================= */

function IconGrid({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
        stroke={active ? "#fff" : "currentColor"}
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
        stroke={active ? "#fff" : "currentColor"}
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
        stroke={active ? "#fff" : "currentColor"}
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
        stroke={active ? "#fff" : "currentColor"}
        strokeWidth="2"
      />
      <path d="M8 8v8M12 8v6M16 8v10" stroke={active ? "#fff" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function IconCalendar({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M4 8h16M6 6h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z"
        stroke={active ? "#fff" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M8 12h4M8 16h7" stroke={active ? "#fff" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* ================= THEME ================= */

const GREEN = "#0E4B39"
const GREEN2 = "#0A3A2C"
const INK = "#0B1511"
const MUTED = "rgba(11,21,17,0.58)"
const BORDER = "rgba(14,75,57,0.14)"
const SHADOW = "0 18px 50px rgba(14,75,57,0.14)"
const FONT = "Manrope, -apple-system, BlinkMacSystemFont, sans-serif"

const S = {
  wrapper: {
    padding: "96px 14px 14px",
    display: "flex",
    justifyContent: "center",
    transition: "width .18s ease"
  },

  wrapperMobile: {
    position: "fixed",
    top: 76,
    left: 0,
    bottom: 0,
    width: 350,
    padding: 14,
    zIndex: 90,
    transition: "transform .18s ease"
  },

  overlay: {
    position: "fixed",
    top: 76,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 85,
    background: "rgba(0,0,0,0.28)",
    backdropFilter: "blur(3px)",
    WebkitBackdropFilter: "blur(3px)"
  },

  panel: {
    height: "100%",
    borderRadius: 24,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: SHADOW,
    display: "flex",
    flexDirection: "column",
    fontFamily: FONT
  },

  panelMobile: {
    height: "100%",
    borderRadius: 24,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 24px 70px rgba(0,0,0,0.22)",
    display: "flex",
    flexDirection: "column",
    fontFamily: FONT,
    padding: "16px 14px"
  },

  head: {
    padding: "12px 12px 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },

  mark: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN2} 100%)`,
    boxShadow: "0 10px 18px rgba(14,75,57,0.20)"
  },

  title: { fontSize: 14, fontWeight: 950, color: INK, letterSpacing: 0.2 },
  sub: { marginTop: 3, fontSize: 11, fontWeight: 800, color: MUTED },

  ctrlBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: `1px solid ${BORDER}`,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 950,
    color: INK,
    boxShadow: "0 12px 26px rgba(14,75,57,0.10)"
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "0 10px 10px",
    padding: "12px 12px",
    borderRadius: 18,
    textDecoration: "none",
    border: "1px solid transparent",
    transition: "transform .12s ease, background .12s ease, box-shadow .12s ease"
  },

  itemCollapsed: {
    justifyContent: "center",
    margin: "0 8px 10px",
    padding: "12px 10px"
  },

  itemActive: {
    background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN2} 100%)`,
    boxShadow: "0 18px 46px rgba(14,75,57,0.22)"
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(14,75,57,0.08)",
    border: `1px solid ${BORDER}`,
    color: GREEN
  },

  iconBoxActive: {
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#fff"
  },

  label: { fontSize: 13, fontWeight: 950, color: INK, letterSpacing: 0.1 },
  labelActive: { color: "#fff" },

  pip: {
    marginLeft: "auto",
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 10px 16px rgba(0,0,0,0.18)",
    transition: "opacity .12s ease"
  },

  footer: { marginTop: "auto", padding: "14px 14px 16px" },
  footerLine: { height: 1, background: BORDER, marginBottom: 12 },
  footerTitle: { fontSize: 11, fontWeight: 950, letterSpacing: 0.35, textTransform: "uppercase", color: GREEN },
  footerText: { marginTop: 8, fontSize: 12, fontWeight: 750, color: MUTED, lineHeight: 1.35 }
}
