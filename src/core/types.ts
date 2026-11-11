import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Color tuple in normalized [r, g, b, a] range (0.0 to 1.0) */
export type RGBA = [number, number, number, number]

/** RGB color tuple in normalized [r, g, b] range (0.0 to 1.0) */
export type RGB = [number, number, number]

/**
 * Optical paint profile computed for an individual glass surface.
 */
export interface ButtonGlassPaint {
  /** Surface face tint color [r, g, b] (0.0 - 1.0) */
  face: RGB
  /** Effective composited backdrop scene color [r, g, b] (0.0 - 1.0) */
  scene: RGB
  /** Border corner radius in physical pixels */
  radius: number
  /** Whether the underlying background is dark */
  dark: boolean
}

/**
 * Physical optics configuration parameters for the WebGL2 glass shader.
 */
export interface GlassOpticsConfig {
  /** Refractive index (default: 1.518 for standard optical crown glass) */
  ior?: number
  /** Bevel intensity factor (default: 1.0) */
  bevelIntensity?: number
  /** Specular highlight softbox power (default: 14.0) */
  specularPower?: number
  /** Rim lip glow brightness (default: 1.0) */
  lipGlow?: number
  /** Fresnel reflection strength (default: 0.48) */
  fresnelStrength?: number
}

/**
 * Button variant styles.
 */
export type LiquidGlassVariant = 'default' | 'primary' | 'danger' | 'accent' | 'ghost'

/**
 * Button sizes.
 */
export type LiquidGlassSize = 'sm' | 'md' | 'lg'

/**
 * Props for the React `<LiquidGlassButton>` component.
 */
export interface LiquidGlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant style */
  variant?: LiquidGlassVariant
  /** Button size preset */
  size?: LiquidGlassSize
  /** Corner radius in pixels, or 'pill' for full pill-shape */
  radius?: number | 'pill'
  /** Optional custom background tint (hex, rgb, or css color) */
  tint?: string
  /** Physical optics overrides */
  optics?: GlassOpticsConfig
  /** Optional leading icon element */
  leadingIcon?: ReactNode
  /** Optional trailing icon element */
  trailingIcon?: ReactNode
  /** Whether the button is in a busy/loading state */
  loading?: boolean
  /** Custom children content */
  children?: ReactNode
}

/**
 * Internal state for an observed glass button tile.
 */
export interface ButtonFaceTile {
  canvas: HTMLCanvasElement
  visible: boolean
  paint: ButtonGlassPaint | null
  width: number
  height: number
  light: [number, number]
  pressed: number
  target: number
  velocity: number
  until: number
}

/**
 * Configuration options for the Vanilla JS controller.
 */
export interface LiquidGlassControllerOptions {
  /** CSS selector for candidate elements (default: 'button.liquid-glass-btn, [data-liquid-glass]') */
  selector?: string
  /** CSS selector for elements to exclude from glass rendering */
  excludeSelector?: string
  /** Container root element to observe (default: document.body) */
  root?: HTMLElement | Document
  /** Callback fired when WebGL2 context is lost */
  onContextLost?: () => void
}
