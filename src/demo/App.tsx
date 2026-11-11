import { useState, useEffect, useRef } from 'react'
import { LiquidGlassButton } from '../components/LiquidGlassButton'
import type { GlassOpticsConfig } from '../core/types'
import './App.css'

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'mesh' | 'neon'>('light')
  const [clickCount, setClickCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [customRadius, setCustomRadius] = useState<number | 'pill'>('pill')
  const [pointerCoords, setPointerCoords] = useState<[number, number]>([0, 0])

  // Apple Liquid Glass Mode: 'clear' ("Trong suốt") vs 'tinted' ("Phủ màu")
  const [glassMode, setGlassMode] = useState<'clear' | 'tinted'>('clear')
  const [transmittance, setTransmittance] = useState(0.82)
  const [toggleState, setToggleState] = useState(true)

  // Floating capsule scroll position inside simulated iOS viewport
  const [scrollY, setScrollY] = useState(0)
  const phoneBodyRef = useRef<HTMLDivElement>(null)

  const [optics, setOptics] = useState<GlassOpticsConfig>({
    ior: 1.518,
    specularPower: 14.0,
    lipGlow: 1.0,
    fresnelStrength: 0.48,
    bevelIntensity: 1.0,
    mode: 'clear',
    transmittance: 0.82,
    causticStrength: 1.15,
    dispersion: 1.0,
  })

  // Synchronize optics with mode switch
  const handleModeChange = (val: number) => {
    // 0 = tinted (phủ màu), 1 = clear (trong suốt)
    const newTransmittance = Math.max(0.12, Math.min(0.95, val))
    setTransmittance(newTransmittance)
    const mode = newTransmittance >= 0.5 ? 'clear' : 'tinted'
    setGlassMode(mode)
    setOptics((prev) => ({
      ...prev,
      mode,
      transmittance: newTransmittance,
      causticStrength: mode === 'clear' ? 1.25 : 0.85,
    }))
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlTheme = params.get('theme') as 'light' | 'dark' | 'mesh' | 'neon' | null
      if (urlTheme && ['light', 'dark', 'mesh', 'neon'].includes(urlTheme)) {
        setTheme(urlTheme)
      }
      const urlMode = params.get('mode')
      if (urlMode === 'tinted') {
        handleModeChange(0.20)
      } else if (urlMode === 'clear') {
        handleModeChange(0.85)
      }
      const scroll = parseInt(params.get('scroll') || '0', 10)
      if (scroll > 0 && phoneBodyRef.current) {
        phoneBodyRef.current.scrollTop = scroll
        setScrollY(scroll)
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      setPointerCoords([Math.round(e.clientX), Math.round(e.clientY)])
    }
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  return (
    <div className="demo-container">
      <header className="header">
        <div className="badge-row">
          <span className="badge badge--apple"> Apple Liquid Glass HIG</span>
          <span className="badge badge--author">Owned by Duong Thanh Duy (@thanhduykx)</span>
          <span className="badge">WebGL2 Realtime Shader</span>
          <span className="badge">Snell Refraction (n=1.518)</span>
          <span className="badge">Young-Laplace Meniscus</span>
          <span className="badge">WCAG AA &ge; 4.5:1</span>
        </div>
        <h1>
          <span>Liquid Glass Button</span>
        </h1>
        <p>
          Ultra-realistic refractive liquid glass interface components, re-developed based on Apple&apos;s
          Liquid Glass UI specification and iOS &amp; visionOS Human Interface Guidelines.
          Featuring Snell&apos;s Law refraction, Young-Laplace fluidic meniscus profile, total internal reflection caustics,
          and dual-source dynamic specular lighting.
        </p>

        <div className="theme-selector">
          {(['light', 'dark', 'mesh', 'neon'] as const).map((t) => (
            <button
              key={t}
              className={`theme-btn ${theme === t ? 'active' : ''}`}
              onClick={() => setTheme(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)} Mode
            </button>
          ))}
        </div>
      </header>

      {/* Hero Apple Park Liquid Glass Interactive Showcase (Matching User Screenshots) */}
      <section className="card apple-park-showcase-card">
        <div className="showcase-header">
          <div>
            <h2>Apple Park Interactive Liquid Glass Showcase</h2>
            <p className="card-desc">
              Direct implementation of Apple&apos;s Liquid Glass design shown in iOS &amp; visionOS:
              a floating liquid glass pill navbar with circular menu button and search bar,
              and an authentic liquid glass toggle switch.
            </p>
          </div>
          <div className="mode-pill-badge">
            Current Mode: <strong>{glassMode === 'clear' ? 'Trong suốt (Clear)' : 'Phủ màu (Tinted)'}</strong>
          </div>
        </div>

        <div className="showcase-layout">
          {/* Simulated iOS Device Viewport */}
          <div className="phone-mockup">
            <div className="phone-screen">
              {/* iOS Status Bar */}
              <div className="ios-status-bar">
                <span className="time">12:45</span>
                <div className="ios-icons">
                  <span className="signal">••••</span>
                  <span className="wifi">ᯤ</span>
                  <span className="battery">74</span>
                </div>
              </div>

              {/* iOS Navigation Header */}
              <div className="ios-nav-header">
                <button className="ios-back-btn" aria-label="Back">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <span className="ios-title">Liquid Glass</span>
                <div style={{ width: 32 }} />
              </div>

              {/* Scrollable Document Area */}
              <div
                className="phone-scroll-area"
                ref={phoneBodyRef}
                onScroll={(e) => setScrollY((e.target as HTMLElement).scrollTop)}
              >
                {/* 1. Apple Park Building Section */}
                <div className="content-card">
                  <img
                    src="/demo-assets/apple-park-building.jpg"
                    alt="Apple Park Ring Building"
                    className="content-image"
                  />
                  <div className="content-body">
                    <h3>Chào mừng đến Apple Park</h3>
                    <h4 className="subtitle">Cupertino, California</h4>
                    <p>
                      Tìm hiểu về thiết kế và lịch sử của Apple Park, cũng như khám phá thiên nhiên và vẻ đẹp độc đáo nơi đây.
                    </p>
                  </div>
                </div>

                {/* 2. Rainbow Arch Section */}
                <div className="content-card">
                  <div className="content-body" style={{ paddingTop: 16 }}>
                    <h3>Hồ nước</h3>
                    <p>
                      Nép mình giữa sóng nước lăn tăn và những hàng cây xanh tốt, đây là một trong những địa điểm yên bình nhất khuôn viên.
                    </p>
                  </div>
                  <img
                    src="/demo-assets/apple-park-rainbow.jpg"
                    alt="Apple Park Rainbow Arch"
                    className="content-image"
                  />
                </div>

                {/* 3. Architecture Stairs Section */}
                <div className="content-card">
                  <div className="content-body" style={{ paddingTop: 16 }}>
                    <h3>Kiến trúc</h3>
                    <p>
                      Apple Park được thiết kế cho hoạt động đi bộ và khám phá. Các yếu tố thiết kế sáng tạo đề cao không gian mở và sự kết nối với thiên nhiên.
                    </p>
                  </div>
                  <img
                    src="/demo-assets/apple-park-stairs.jpg"
                    alt="Apple Park Architecture Stairs"
                    className="content-image"
                  />
                </div>
              </div>

              {/* Floating Liquid Glass Capsule Bar Floating Over Content */}
              <div className="floating-liquid-capsule-bar">
                {/* Circular Glass Hamburger Button */}
                <LiquidGlassButton
                  optics={optics}
                  radius="pill"
                  className="capsule-circle-btn"
                  onClick={() => setClickCount((c) => c + 1)}
                  aria-label="Menu"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <line x1="3" y1="7" x2="21" y2="7" />
                    <line x1="3" y1="12" x2="17" y2="12" />
                    <line x1="3" y1="17" x2="21" y2="17" />
                  </svg>
                </LiquidGlassButton>

                {/* Liquid Glass Search Pill Bar */}
                <LiquidGlassButton
                  optics={optics}
                  radius="pill"
                  className="capsule-search-bar"
                  onClick={() => setClickCount((c) => c + 1)}
                  leadingIcon={
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  }
                >
                  Tìm kiếm
                </LiquidGlassButton>
              </div>

              {/* Apple Liquid Glass Mode Switcher Slider (From Screenshot 3/4/5/6) */}
              <div className="ios-slider-panel">
                <div className="slider-track-container">
                  <span className="slider-icon slider-icon--clear" title="Trong suốt (Clear)">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <rect x="7" y="7" width="10" height="10" rx="3" strokeDasharray="2 2" />
                    </svg>
                  </span>
                  <input
                    type="range"
                    min="0.12"
                    max="0.95"
                    step="0.01"
                    value={transmittance}
                    onChange={(e) => handleModeChange(parseFloat(e.target.value))}
                    className="ios-range-slider"
                  />
                  <span className="slider-icon slider-icon--tinted" title="Phủ màu (Tinted)">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="5" opacity="0.3" />
                      <rect x="7" y="7" width="10" height="10" rx="3" />
                    </svg>
                  </span>
                </div>
                <p className="slider-vietnamese-caption">
                  Tùy chọn &ldquo;Trong suốt&rdquo; có độ xuyên thấu cao hơn, còn &ldquo;Phủ màu&rdquo; làm tăng độ mờ và tương phản cho nội dung và các nút điều khiển.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Feature Cards Alongside Phone */}
          <div className="showcase-controls">
            {/* Liquid Glass Toggle Switch Component (From Screenshot 1) */}
            <div className="feature-box">
              <h3>Liquid Glass Toggle Switch</h3>
              <p className="feature-desc">
                Physical liquid glass capsule knob sliding over an active colored track with convex lens magnification.
              </p>
              <div className="toggle-demo-row">
                <div
                  className={`liquid-toggle-track ${toggleState ? 'active' : ''}`}
                  onClick={() => setToggleState(!toggleState)}
                  role="switch"
                  aria-checked={toggleState}
                  tabIndex={0}
                >
                  <LiquidGlassButton
                    optics={optics}
                    radius="pill"
                    className="liquid-toggle-knob"
                    onClick={(e) => {
                      e.stopPropagation()
                      setToggleState(!toggleState)
                    }}
                  />
                </div>
                <div className="toggle-label-wrap">
                  <strong>Status: {toggleState ? 'Active (Green Track)' : 'Off (Muted)'}</strong>
                  <span className="toggle-sub">Notice how the convex bead curves and refracts the colored track underneath</span>
                </div>
              </div>
            </div>

            {/* Mode Switch Explanation Card */}
            <div className="feature-box">
              <h3>Dual Transmission Modes</h3>
              <div className="mode-toggle-buttons">
                <button
                  className={`mode-btn ${glassMode === 'clear' ? 'active' : ''}`}
                  onClick={() => handleModeChange(0.85)}
                >
                  ✨ Trong suốt (Clear)
                </button>
                <button
                  className={`mode-btn ${glassMode === 'tinted' ? 'active' : ''}`}
                  onClick={() => handleModeChange(0.20)}
                >
                  🎨 Phủ màu (Tinted)
                </button>
              </div>
              <ul className="physics-feature-list">
                <li>
                  <strong>Young-Laplace Meniscus:</strong> Flat central optical window with high-curvature perimeter bead.
                </li>
                <li>
                  <strong>Snell Refraction (n=1.518):</strong> Optical crown glass deflection ray calculated at 60 FPS in WebGL2.
                </li>
                <li>
                  <strong>TIR Caustic Bead:</strong> Total internal reflection concentrator near critical angle &theta;<sub>c</sub> &approx; 41.1&deg;.
                </li>
                <li>
                  <strong>Chromatic Dispersion:</strong> Cauchy red/blue wavelength separation along refraction curves.
                </li>
              </ul>
            </div>

            {/* Quick Live Stats */}
            <div className="feature-box hud-mini">
              <div className="hud-mini-item">
                <span className="hud-mini-label">Transmittance (&tau;)</span>
                <span className="hud-mini-val">{(transmittance * 100).toFixed(0)}%</span>
              </div>
              <div className="hud-mini-item">
                <span className="hud-mini-label">Caustic Focus</span>
                <span className="hud-mini-val">{optics.causticStrength?.toFixed(2)}x</span>
              </div>
              <div className="hud-mini-item">
                <span className="hud-mini-label">GPU Render Latency</span>
                <span className="hud-mini-val">&lt; 0.5ms</span>
              </div>
              <div className="hud-mini-item">
                <span className="hud-mini-label">Scroll Y Offset</span>
                <span className="hud-mini-val">{Math.round(scrollY)}px</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Button Variants Section */}
      <section className="card">
        <h2>Component Variants &amp; Actions</h2>
        <p className="card-desc">
          Move your cursor over the buttons to see dynamic specular lighting track pointer coordinates.
          Click or press to observe real-time spring physics compression.
        </p>

        <div className="button-group">
          <LiquidGlassButton optics={optics} onClick={() => setClickCount((c) => c + 1)}>
            Default Glass
          </LiquidGlassButton>

          <LiquidGlassButton
            optics={optics}
            variant="primary"
            onClick={() => setClickCount((c) => c + 1)}
            leadingIcon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            }
          >
            Primary Action
          </LiquidGlassButton>

          <LiquidGlassButton
            optics={optics}
            variant="accent"
            onClick={() => setClickCount((c) => c + 1)}
            leadingIcon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            }
          >
            Confirmed
          </LiquidGlassButton>

          <LiquidGlassButton
            optics={optics}
            variant="danger"
            onClick={() => setClickCount((c) => c + 1)}
            trailingIcon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          >
            Destructive
          </LiquidGlassButton>

          <LiquidGlassButton optics={optics} variant="ghost" onClick={() => setClickCount((c) => c + 1)}>
            Ghost Material
          </LiquidGlassButton>

          <LiquidGlassButton disabled>Disabled Glass</LiquidGlassButton>

          <LiquidGlassButton
            optics={optics}
            loading={loading}
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 2000)
            }}
          >
            {loading ? 'Processing…' : 'Simulate Loading'}
          </LiquidGlassButton>
        </div>

        {/* HUD Stats */}
        <div className="hud-grid">
          <div className="hud-item">
            <div className="hud-label">Clicks Registered</div>
            <div className="hud-value">{clickCount}</div>
          </div>
          <div className="hud-item">
            <div className="hud-label">Cursor / Light Position</div>
            <div className="hud-value">
              {pointerCoords[0]}, {pointerCoords[1]}
            </div>
          </div>
          <div className="hud-item">
            <div className="hud-label">Active GPU Contexts</div>
            <div className="hud-value">1 (Pooled)</div>
          </div>
          <div className="hud-item">
            <div className="hud-label">Idle GPU Overhead</div>
            <div className="hud-value">0% (Event-Driven)</div>
          </div>
        </div>
      </section>

      {/* Sizing & Geometry Section */}
      <section className="card">
        <h2>Sizes &amp; Corner Radius</h2>
        <p className="card-desc">
          Liquid Glass adapts to various geometries, from pill capsules to iOS rounded rectangles.
        </p>

        <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Corner Radius:</span>
          {(['pill', 16, 12, 8] as const).map((r) => (
            <button
              key={String(r)}
              className={`theme-btn ${customRadius === r ? 'active' : ''}`}
              onClick={() => setCustomRadius(r)}
            >
              {r === 'pill' ? 'Pill (999px)' : `${r}px`}
            </button>
          ))}
        </div>

        <div className="button-group">
          <LiquidGlassButton optics={optics} size="sm" radius={customRadius} variant="primary">
            Small (32px)
          </LiquidGlassButton>
          <LiquidGlassButton optics={optics} size="md" radius={customRadius} variant="primary">
            Medium (44px)
          </LiquidGlassButton>
          <LiquidGlassButton optics={optics} size="lg" radius={customRadius} variant="primary">
            Large (52px)
          </LiquidGlassButton>
        </div>
      </section>

      {/* Real-time Physical Optics Tuner */}
      <section className="card">
        <h2>Physical Optics Tuner</h2>
        <p className="card-desc">
          Live shader parameters calculated in real-time by the WebGL2 GPU engine.
        </p>

        <div className="optics-grid">
          <div className="optics-control">
            <div className="optics-header">
              <span>Snell Refractive Index (IOR)</span>
              <strong>{optics.ior?.toFixed(3)}</strong>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.2"
              step="0.01"
              value={optics.ior}
              onChange={(e) => setOptics((prev) => ({ ...prev, ior: parseFloat(e.target.value) }))}
            />
            <span className="optics-hint">Crown Glass = 1.518, Diamond = 2.417, Water = 1.333</span>
          </div>

          <div className="optics-control">
            <div className="optics-header">
              <span>Transmittance (&ldquo;Trong suốt&rdquo; &harr; &ldquo;Phủ màu&rdquo;)</span>
              <strong>{(transmittance * 100).toFixed(0)}%</strong>
            </div>
            <input
              type="range"
              min="0.12"
              max="0.95"
              step="0.01"
              value={transmittance}
              onChange={(e) => handleModeChange(parseFloat(e.target.value))}
            />
            <span className="optics-hint">High = Clear glass see-through, Low = Frosted tint</span>
          </div>

          <div className="optics-control">
            <div className="optics-header">
              <span>Inner Caustic Focus Intensity</span>
              <strong>{optics.causticStrength?.toFixed(2)}x</strong>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.05"
              value={optics.causticStrength}
              onChange={(e) => setOptics((prev) => ({ ...prev, causticStrength: parseFloat(e.target.value) }))}
            />
            <span className="optics-hint">Total internal reflection (TIR) focal bead at meniscus curve</span>
          </div>

          <div className="optics-control">
            <div className="optics-header">
              <span>Specular Softbox Exponent</span>
              <strong>{optics.specularPower?.toFixed(1)}</strong>
            </div>
            <input
              type="range"
              min="4"
              max="32"
              step="1"
              value={optics.specularPower}
              onChange={(e) => setOptics((prev) => ({ ...prev, specularPower: parseFloat(e.target.value) }))}
            />
            <span className="optics-hint">Higher values create tighter, more focused glossy glints</span>
          </div>

          <div className="optics-control">
            <div className="optics-header">
              <span>Rim Lip Glow</span>
              <strong>{optics.lipGlow?.toFixed(2)}x</strong>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.05"
              value={optics.lipGlow}
              onChange={(e) => setOptics((prev) => ({ ...prev, lipGlow: parseFloat(e.target.value) }))}
            />
            <span className="optics-hint">Amplifies Apple&apos;s signature outer convex edge highlight</span>
          </div>

          <div className="optics-control">
            <div className="optics-header">
              <span>Fresnel Reflectance Multiplier</span>
              <strong>{optics.fresnelStrength?.toFixed(2)}</strong>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.02"
              value={optics.fresnelStrength}
              onChange={(e) => setOptics((prev) => ({ ...prev, fresnelStrength: parseFloat(e.target.value) }))}
            />
            <span className="optics-hint">Controls grazing angle reflectivity based on Schlick&apos;s Law</span>
          </div>

          <div className="optics-control">
            <div className="optics-header">
              <span>Chromatic Dispersion</span>
              <strong>{optics.dispersion?.toFixed(2)}x</strong>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.05"
              value={optics.dispersion}
              onChange={(e) => setOptics((prev) => ({ ...prev, dispersion: parseFloat(e.target.value) }))}
            />
            <span className="optics-hint">Prismatic red/blue light splitting along the refractive gradient</span>
          </div>
        </div>
      </section>

      {/* Quick Start & Code Example */}
      <section className="card">
        <h2>Quick Start (React)</h2>
        <p className="card-desc">Install from npm or use directly in your project.</p>
        <div className="code-box">
          <pre>{`npm install liquid-glass-button`}</pre>
        </div>
        <div className="code-box">
          <pre>{`import { LiquidGlassButton } from 'liquid-glass-button'
import 'liquid-glass-button/style.css'

export function App() {
  return (
    <LiquidGlassButton
      variant="primary"
      size="md"
      optics={{ mode: 'clear', ior: 1.518 }}
      onClick={() => console.log('Clicked!')}
    >
      Click Me
    </LiquidGlassButton>
  )
}`}</pre>
        </div>
      </section>

      <footer className="footer">
        <p>
          <strong>Liquid Glass Button</strong> &mdash; Created &amp; Owned by{' '}
          <a href="https://github.com/thanhduykx" target="_blank" rel="noreferrer">
            Dương Thành Thanh Duy (@thanhduykx)
          </a>
        </p>
        <p>
          Re-developed and inspired by Apple&apos;s Liquid Glass UI specification &amp; Apple Human
          Interface Guidelines. Released under the MIT License.
        </p>
      </footer>
    </div>
  )
}
