import { useEffect } from 'react'
import { LiquidGlassController } from '../core/observer'
import type { LiquidGlassControllerOptions } from '../core/types'
import '../styles/liquid-glass.css'

export interface LiquidGlassEffectsProps extends LiquidGlassControllerOptions {}

/**
 * `<LiquidGlassEffects />`
 * 
 * Drop-in React component that mounts the global event-driven WebGL2 liquid glass controller.
 * Automatically enhances all button elements matching the selector with Apple-style liquid glass refraction.
 */
export function LiquidGlassEffects(props: LiquidGlassEffectsProps) {
  useEffect(() => {
    const controller = new LiquidGlassController(props)
    return () => {
      controller.destroy()
    }
  }, [props.selector, props.excludeSelector])

  return null
}
