import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { LiquidGlassButton } from './LiquidGlassButton'
import type { GlassOpticsConfig, RGB } from '../core/types'

export interface LiquidGlassToggleProps {
  /** Checked/Active state of the switch */
  checked?: boolean
  /** Callback invoked when checked state changes */
  onChange?: (checked: boolean) => void
  /** Disabled state */
  disabled?: boolean
  /** Additional CSS class names */
  className?: string
  /** Accessible label */
  ariaLabel?: string
  /** Active track color (default: Apple iOS green #34c759) */
  activeColor?: RGB
  /** Inactive track color (default: Apple iOS gray #e5e5ea) */
  inactiveColor?: RGB
  /** Background color outside track (default: white [1, 1, 1]) */
  bgColor?: RGB
  /** Custom optics overrides */
  optics?: Partial<GlassOpticsConfig>
}

/**
 * `<LiquidGlassToggle>`
 * 
 * Authentic Apple Liquid Glass Toggle Switch.
 * Features a convex refractive liquid glass capsule knob sliding over an active track,
 * optically bending and magnifying the underlying colored track according to Snell's Law
 * and the Young-Laplace fluidic meniscus profile.
 */
export function LiquidGlassToggle({
  checked: controlledChecked,
  onChange,
  disabled = false,
  className = '',
  ariaLabel = 'Liquid Glass Switch',
  activeColor = [0.204, 0.780, 0.349],   // #34c759
  inactiveColor = [0.898, 0.898, 0.918], // #e5e5ea
  bgColor = [1.0, 1.0, 1.0],
  optics: customOptics = {},
}: LiquidGlassToggleProps) {
  const [internalChecked, setInternalChecked] = useState(false)
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked

  const toggle = (e?: MouseEvent | KeyboardEvent) => {
    e?.stopPropagation()
    if (disabled) return
    const next = !isChecked
    if (controlledChecked === undefined) {
      setInternalChecked(next)
    }
    onChange?.(next)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggle(e)
    }
  }

  // Track dimensions in CSS pixels:
  // Active colored strip is 50px wide by 24px tall, with corner radius 12.
  // Knob is 44px wide by 36px tall (convex liquid lens overflowing the strip).
  // When active, the knob center is shifted 13px right from the colored strip center.
  const trackSize: [number, number] = [50, 24]
  const trackRadius = 12
  const knobOffset: [number, number] = isChecked ? [-13, 0] : [13, 0]
  const currentColor: RGB = isChecked ? activeColor : inactiveColor

  const knobOptics: GlassOpticsConfig = {
    ior: 1.518,
    bevelIntensity: 1.25,
    specularPower: 16.0,
    lipGlow: 1.15,
    fresnelStrength: 0.52,
    causticStrength: 1.45,
    dispersion: 1.35,
    mode: 'clear',
    transmittance: 0.88,
    track: {
      size: trackSize,
      offset: knobOffset,
      radius: trackRadius,
      color: currentColor,
      bgColor,
    },
    ...customOptics,
  }

  return (
    <div
      className={`liquid-glass-toggle-wrap ${isChecked ? 'active' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      role="switch"
      aria-checked={isChecked}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      onClick={toggle}
      onKeyDown={handleKeyDown}
    >
      <div className="liquid-glass-toggle-track">
        <div className="liquid-glass-toggle-inner-bar" />
        <LiquidGlassButton
          optics={knobOptics}
          radius="pill"
          className="liquid-glass-toggle-knob"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
