/**
 * Liquid Glass Button Library
 * 
 * Ultra-realistic refractive liquid glass button inspired by Apple's Liquid Glass UI specification & HIG Materials.
 * 
 * @author Dương Thành Thanh Duy (@thanhduykx)
 * @license MIT
 */

// Styles
import './styles/liquid-glass.css'

// React Components
export { LiquidGlassButton } from './components/LiquidGlassButton'
export { LiquidGlassEffects, type LiquidGlassEffectsProps } from './components/LiquidGlassEffects'

// Core Controller & Engine
export { LiquidGlassController, DEFAULT_SELECTOR, DEFAULT_EXCLUSIONS } from './core/observer'
export { createButtonGlassRenderer, type ButtonGlassRenderer } from './core/renderer'
export {
  createButtonPaintReader,
  chooseGlassInk,
  glassContrast,
  luminance,
  mix,
  cssColor,
} from './core/paint'
export { stepSpring, createSpring, type SpringState } from './core/physics'
export { VERTEX_SHADER, FRAGMENT_SHADER } from './core/shader'

// TypeScript Types
export type {
  RGBA,
  RGB,
  ButtonGlassPaint,
  GlassOpticsConfig,
  LiquidGlassVariant,
  LiquidGlassSize,
  LiquidGlassButtonProps,
  LiquidGlassControllerOptions,
  ButtonFaceTile,
} from './core/types'
