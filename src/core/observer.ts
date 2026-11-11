import { createButtonGlassRenderer, type ButtonGlassRenderer } from './renderer'
import { createButtonPaintReader, cssColor } from './paint'
import { stepSpring } from './physics'
import type { ButtonFaceTile, LiquidGlassControllerOptions } from './types'

export const DEFAULT_SELECTOR = 'button.liquid-glass-btn, [data-liquid-glass], button[data-glass]'
export const DEFAULT_EXCLUSIONS = '[data-glass-exclude], [data-glass-exclude] *, :disabled, [aria-disabled="true"], [hidden]'

export class LiquidGlassController {
  private options: LiquidGlassControllerOptions
  private renderer: ButtonGlassRenderer | null = null
  private readPaint = createButtonPaintReader()
  private faces = new Map<HTMLElement, ButtonFaceTile>()
  private pending = new Set<HTMLElement>()
  private frame = 0
  private lastTime = 0
  private disposed = false
  private resizeObserver: ResizeObserver | null = null
  private intersectionObserver: IntersectionObserver | null = null
  private mutationObserver: MutationObserver | null = null
  private abortController = new AbortController()

  constructor(options: LiquidGlassControllerOptions = {}) {
    this.options = {
      selector: options.selector || DEFAULT_SELECTOR,
      excludeSelector: options.excludeSelector || DEFAULT_EXCLUSIONS,
      root: options.root || (typeof document !== 'undefined' ? document.body : undefined),
      onContextLost: options.onContextLost,
    }

    if (typeof window === 'undefined' || !this.options.root) return

    this.init()
  }

  private init() {
    this.renderer = createButtonGlassRenderer(() => {
      this.handleContextLost()
      this.options.onContextLost?.()
    })

    const rootEl =
      this.options.root instanceof Document ? this.options.root.body : (this.options.root as HTMLElement)

    // ResizeObserver to adapt to size changes
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          this.invalidate(entry.target as HTMLElement)
        }
      })
    }

    // IntersectionObserver to pause rendering when scrolled out of view
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement
          const face = this.faces.get(el)
          if (face) {
            face.visible = entry.isIntersecting
            if (face.visible) this.invalidate(el)
          }
        }
      })
    }

    // MutationObserver to track DOM changes and theme updates
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver((records) => {
        for (const record of records) {
          if (record.target === document.documentElement) {
            this.scan(rootEl)
            continue
          }
          if (record.type === 'attributes' && record.target instanceof HTMLElement) {
            this.scan(record.target)
          }
          if (record.type === 'childList') {
            record.addedNodes.forEach((node) => {
              if (node instanceof Element && !node.matches('.button-glass__surface')) {
                this.scan(node)
              }
            })
            record.removedNodes.forEach((node) => {
              if (node instanceof HTMLElement && !node.isConnected) {
                this.forget(node)
                node.querySelectorAll<HTMLElement>('[data-glass-button]').forEach((el) => this.forget(el))
              }
            })
          }
        }
      })

      this.mutationObserver.observe(rootEl, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'disabled', 'aria-disabled', 'hidden'],
      })

      this.mutationObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'class'],
      })
    }

    this.bindEvents()
    this.scan(rootEl)
  }

  private bindEvents() {
    const signal = this.abortController.signal
    const opts = { capture: true, signal }

    const pulse = (event: Event, targetPress?: number) => {
      if (!(event.target instanceof Element)) return
      const element = event.target.closest<HTMLElement>('[data-glass-button]')
      const face = element && this.faces.get(element)
      if (!face || !element || element.matches(':disabled, [aria-disabled="true"]')) return

      if (targetPress !== undefined) {
        face.target = targetPress
      }

      if (event instanceof PointerEvent) {
        const rect = element.getBoundingClientRect()
        const normX = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5
        const normY = 0.8 - ((event.clientY - rect.top) / Math.max(1, rect.height)) * 0.3
        face.light = [normX, normY]
      }

      face.until = performance.now() + 180
      this.schedule()
    }

    const release = () => {
      for (const face of this.faces.values()) {
        if (face.target) {
          face.target = 0
          face.until = performance.now() + 250
        }
      }
      this.schedule()
    }

    document.addEventListener('pointermove', (e) => pulse(e), opts)
    document.addEventListener('pointerdown', (e) => pulse(e, 1.0), opts)
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      document.addEventListener(type, release, opts)
    }

    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === ' ' || e.key === 'Enter') pulse(e, 1.0)
      },
      opts
    )
    document.addEventListener('keyup', release, opts)
    window.addEventListener('blur', release, opts)

    // Visibility change pauses/resumes loop
    document.addEventListener(
      'visibilitychange',
      () => {
        this.lastTime = 0
        if (document.hidden) {
          cancelAnimationFrame(this.frame)
          this.frame = 0
          release()
        } else {
          release()
          if (this.options.root) this.scan(this.options.root instanceof Document ? this.options.root.body : this.options.root)
        }
      },
      opts
    )
  }

  public register(element: HTMLElement) {
    if (this.disposed || !this.supportsElement(element)) {
      this.forget(element)
      return
    }

    if (this.faces.has(element)) {
      const face = this.faces.get(element)!
      if (face.canvas.parentElement !== element) {
        element.prepend(face.canvas)
      }
      this.invalidate(element)
      return
    }

    const canvas = document.createElement('canvas')
    canvas.className = 'button-glass__surface'
    canvas.setAttribute('aria-hidden', 'true')

    const face: ButtonFaceTile = {
      canvas,
      visible: true,
      paint: null,
      width: 0,
      height: 0,
      light: [-0.45, 0.8],
      pressed: 0,
      target: 0,
      velocity: 0,
      until: 0,
    }

    this.faces.set(element, face)
    element.dataset.glassButton = ''
    if (getComputedStyle(element).position === 'static') {
      element.dataset.glassButtonPosition = ''
    }

    element.prepend(canvas)
    this.resizeObserver?.observe(element)
    this.intersectionObserver?.observe(element)
    this.invalidate(element)
  }

  public forget(element: HTMLElement) {
    const face = this.faces.get(element)
    if (!face) return

    this.resizeObserver?.unobserve(element)
    this.intersectionObserver?.unobserve(element)
    face.canvas.remove()
    this.faces.delete(element)
    this.pending.delete(element)

    delete element.dataset.glassButton
    delete element.dataset.glassButtonReady
    delete element.dataset.glassButtonFallback
    delete element.dataset.glassButtonPosition
    element.style.removeProperty('--button-glass-ink')
    element.style.removeProperty('--button-glass-base')
  }

  public scan(root: Element) {
    if (root instanceof HTMLElement && this.supportsElement(root)) {
      this.register(root)
    }
    const selector = this.options.selector || DEFAULT_SELECTOR
    root.querySelectorAll<HTMLElement>(selector).forEach((el) => this.register(el))
  }

  public invalidate(element: HTMLElement) {
    if (this.faces.get(element)?.visible) {
      this.pending.add(element)
      this.schedule()
    }
  }

  private schedule() {
    if (!this.disposed && !this.frame && !document.hidden) {
      this.frame = requestAnimationFrame((now) => this.render(now))
    }
  }

  private render(now: number) {
    this.frame = 0
    const dt = Math.min((now - (this.lastTime || now - 16)) / 1000, 0.032)
    this.lastTime = now
    let needsNextFrame = false

    for (const [element, face] of this.faces) {
      if (!face.visible || !element.isConnected) continue

      const moving = Math.abs(face.target - face.pressed) > 0.001 || Math.abs(face.velocity) > 0.001
      if (!this.pending.has(element) && !moving && face.until < now) continue

      if (this.pending.delete(element)) {
        if (!this.supportsElement(element)) {
          this.forget(element)
          continue
        }

        const measured = this.readPaint(element)
        if (!measured) {
          face.paint = null
          face.canvas.hidden = true
          element.style.removeProperty('--button-glass-ink')
          element.style.removeProperty('--button-glass-base')
          continue
        }

        face.canvas.hidden = false
        face.paint = measured.paint
        face.width = element.offsetWidth
        face.height = element.offsetHeight

        element.style.setProperty('--button-glass-ink', cssColor(measured.ink))
        element.style.setProperty('--button-glass-base', cssColor(measured.paint.face))
      }

      if (!face.paint || !face.width || !face.height) continue

      // Step spring physics for button press/release
      const spring = { current: face.pressed, target: face.target, velocity: face.velocity }
      const stillSpringing = stepSpring(spring, dt, 300, 24)
      face.pressed = spring.current
      face.velocity = spring.velocity

      if (this.renderer?.draw(face.canvas, face.width, face.height, face.paint, face.pressed, face.light)) {
        element.dataset.glassButtonReady = ''
      } else {
        delete element.dataset.glassButtonReady
        element.dataset.glassButtonFallback = ''
        continue
      }

      if (stillSpringing || face.until > now) {
        needsNextFrame = true
      }
    }

    if (needsNextFrame) {
      this.schedule()
    }
  }

  private handleContextLost() {
    for (const element of this.faces.keys()) {
      delete element.dataset.glassButtonReady
      element.dataset.glassButtonFallback = ''
    }
  }

  private supportsElement(element: HTMLElement): boolean {
    const selector = this.options.selector || DEFAULT_SELECTOR
    const exclusions = this.options.excludeSelector || DEFAULT_EXCLUSIONS

    return (
      element.matches(selector) &&
      !element.closest(exclusions) &&
      !element.matches(':disabled, [aria-disabled="true"], [hidden]') &&
      (element.textContent?.trim().length ?? 0) <= 120
    )
  }

  public destroy() {
    this.disposed = true
    if (this.frame) {
      cancelAnimationFrame(this.frame)
      this.frame = 0
    }
    this.abortController.abort()
    this.mutationObserver?.disconnect()
    this.resizeObserver?.disconnect()
    this.intersectionObserver?.disconnect()

    for (const el of [...this.faces.keys()]) {
      this.forget(el)
    }

    this.renderer?.dispose()
    this.renderer = null
  }
}
