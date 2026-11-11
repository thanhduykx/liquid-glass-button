import { useState, useEffect } from 'react'
import { LiquidGlassButton } from '../components/LiquidGlassButton'
import type { GlassOpticsConfig } from '../core/types'

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'mesh' | 'neon'>('light')
  const [clickCount, setClickCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [customRadius, setCustomRadius] = useState<number | 'pill'>('pill')
  const [pointerCoords, setPointerCoords] = useState<[number, number]>([0, 0])
  const [optics, setOptics] = useState<GlassOpticsConfig>({
    ior: 1.518,
    specularPower: 14.0,
    lipGlow: 1.0,
    fresnelStrength: 0.48,
    bevelIntensity: 1.0,
  })

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
          <span className="badge">WCAG AA &gt;= 4.5:1</span>
        </div>
        <h1>
          <span>Liquid Glass Button</span>
        </h1>
        <p>
          Ultra-realistic refractive liquid glass button component, re-developed based on Apple&apos;s
          Liquid Glass UI specification and HIG Materials. Featuring Snell&apos;s Law refraction,
          Fresnel reflection, and dynamic pointer light tracking.
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

      {/* Showcase Section */}
      <section className="card">
        <h2>Interactive Showcase</h2>
        <p className="card-desc">
          Move your cursor over the buttons to see dynamic specular lighting track the light direction.
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
        <h2>Sizes & Corner Radius</h2>
        <p className="card-desc">
          Liquid Glass adapts to various geometries, from pill capsules to iOS rounded rectangles.
        </p>

        <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
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
              max="2.0"
              step="0.01"
              value={optics.ior}
              onChange={(e) => setOptics((prev) => ({ ...prev, ior: parseFloat(e.target.value) }))}
            />
            <span className="optics-hint">Crown Glass = 1.518, Diamond = 2.417, Water = 1.333</span>
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
            <span className="optics-hint">Amplifies Apple's signature outer convex edge highlight</span>
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
            <span className="optics-hint">Controls grazing angle reflectivity based on Schlick's Law</span>
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
          <strong>Liquid Glass Button</strong> — Created &amp; Owned by{' '}
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
