import { forwardRef, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { LiquidGlassButtonProps } from '../core/types'
import { LiquidGlassController } from '../core/observer'
import '../styles/liquid-glass.css'

// Shared singleton controller for React component instances
let sharedController: LiquidGlassController | null = null

function getSharedController(): LiquidGlassController | null {
  if (typeof window === 'undefined') return null
  if (!sharedController) {
    sharedController = new LiquidGlassController({
      selector: '.liquid-glass-btn, [data-liquid-glass]',
    })
  }
  return sharedController
}

/**
 * `<LiquidGlassButton>`
 * 
 * An ultra-realistic refractive liquid glass button inspired by Apple's Liquid Glass UI specification,
 * developed by Dương Thành Thanh Duy (@thanhduykx).
 */
export const LiquidGlassButton = forwardRef<HTMLButtonElement, LiquidGlassButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      radius = 'pill',
      tint,
      optics,
      leadingIcon,
      trailingIcon,
      loading = false,
      disabled,
      className = '',
      style,
      children,
      ...restProps
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLButtonElement | null>(null)
    const [isPressed, setIsPressed] = useState(false)

    // Merge internal ref with forwarded ref
    const setRef = (node: HTMLButtonElement | null) => {
      internalRef.current = node
      if (typeof forwardedRef === 'function') {
        forwardedRef(node)
      } else if (forwardedRef) {
        ;(forwardedRef as { current: HTMLButtonElement | null }).current = node
      }
    }

    useEffect(() => {
      const el = internalRef.current
      if (!el) return

      if (optics) {
        ;(el as { __liquidGlassOptics?: typeof optics }).__liquidGlassOptics = optics
      } else {
        delete (el as { __liquidGlassOptics?: typeof optics }).__liquidGlassOptics
      }

      const controller = getSharedController()
      if (controller) {
        controller.register(el)
        controller.invalidate(el)
      }

      return () => {
        if (el && controller) {
          controller.forget(el)
        }
      }
    }, [optics])

    const variantClass = variant !== 'default' ? `liquid-glass-btn--${variant}` : ''
    const sizeClass = `liquid-glass-btn--${size}`
    const combinedClassName = ['liquid-glass-btn', variantClass, sizeClass, className]
      .filter(Boolean)
      .join(' ')

    const customStyles: CSSProperties & Record<string, string | number | undefined> = { ...style }
    if (radius !== undefined) {
      customStyles['--liquid-glass-radius'] = radius === 'pill' ? '999px' : `${radius}px`
      customStyles.borderRadius = radius === 'pill' ? '999px' : `${radius}px`
    }
    if (tint) {
      customStyles.backgroundColor = tint
    }

    return (
      <button
        ref={setRef}
        className={combinedClassName}
        style={customStyles}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        data-liquid-glass=""
        data-pressed={isPressed ? 'true' : undefined}
        onPointerDown={(e) => {
          setIsPressed(true)
          restProps.onPointerDown?.(e)
        }}
        onPointerUp={(e) => {
          setIsPressed(false)
          restProps.onPointerUp?.(e)
        }}
        onPointerCancel={(e) => {
          setIsPressed(false)
          restProps.onPointerCancel?.(e)
        }}
        {...restProps}
      >
        {loading ? (
          <span
            className="liquid-glass-spinner"
            style={{
              display: 'inline-block',
              width: '1em',
              height: '1em',
              border: '2px solid currentColor',
              borderRightColor: 'transparent',
              borderRadius: '50%',
              animation: 'liquid-spin 0.75s linear infinite',
            }}
            aria-hidden="true"
          />
        ) : (
          leadingIcon && <span className="liquid-glass-icon-leading">{leadingIcon}</span>
        )}
        <span className="liquid-glass-label">{children}</span>
        {!loading && trailingIcon && <span className="liquid-glass-icon-trailing">{trailingIcon}</span>}
      </button>
    )
  }
)

LiquidGlassButton.displayName = 'LiquidGlassButton'
