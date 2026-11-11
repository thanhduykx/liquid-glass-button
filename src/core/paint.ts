import type { ButtonGlassPaint, RGB, RGBA } from './types'

/**
 * Composites a foreground RGBA color over a background RGB color via standard alpha blending.
 */
export function mix(front: RGBA | number[], back: RGB | number[]): RGB {
  const alpha = front[3] ?? 1
  return [
    front[0] * alpha + back[0] * (1 - alpha),
    front[1] * alpha + back[1] * (1 - alpha),
    front[2] * alpha + back[2] * (1 - alpha),
  ]
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB color.
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function luminance(rgb: RGB | number[]): number {
  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const r = toLinear(rgb[0])
  const g = toLinear(rgb[1])
  const b = toLinear(rgb[2])
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Computes WCAG 2.1 contrast ratio between two colors (range: 1.0 to 21.0).
 */
export function glassContrast(a: RGB | number[], b: RGB | number[]): number {
  const lumA = luminance(a)
  const lumB = luminance(b)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Converts a normalized RGB array [0..1] to a CSS `rgb(r g b)` string.
 */
export function cssColor(rgb: RGB | number[]): string {
  const r = Math.round(rgb[0] * 255)
  const g = Math.round(rgb[1] * 255)
  const b = Math.round(rgb[2] * 255)
  return `rgb(${r} ${g} ${b})`
}

/**
 * Selects an accessible foreground ink color that guarantees at least 4.5:1 WCAG AA
 * contrast ratio against the dynamically shaded glass face.
 * 
 * If declared ink is already safe (>= 4.5:1), preserves it.
 * Otherwise, tests brand candidates and falls back to pure black/white for tough midtones.
 */
export function chooseGlassInk(declared: RGB | number[], face: RGB | number[]): RGB {
  if (glassContrast(declared, face) >= 4.5) {
    return [declared[0], declared[1], declared[2]]
  }

  // Brand candidates: dark slate & crisp off-white
  const darkCandidate: RGB = [0.075, 0.16, 0.2]
  const lightCandidate: RGB = [0.95, 0.98, 1.0]

  const branded = [darkCandidate, lightCandidate].sort(
    (a, b) => glassContrast(b, face) - glassContrast(a, face)
  )

  if (glassContrast(branded[0], face) >= 4.5) {
    return branded[0]
  }

  // Pure black or pure white fallback for tricky midtone gray backgrounds
  const extremes: RGB[] = [
    [0, 0, 0],
    [1, 1, 1],
  ]
  return extremes.sort((a, b) => glassContrast(b, face) - glassContrast(a, face))[0]
}

/**
 * Creates an efficient cached paint reader utilizing a 1x1 canvas probe
 * to accurately parse CSS color strings into normalized float arrays.
 */
export function createButtonPaintReader() {
  if (typeof document === 'undefined') {
    return () => null
  }

  const probe = document.createElement('canvas')
  probe.width = probe.height = 1
  const ctx = probe.getContext('2d', { willReadFrequently: true })
  const colorCache = new Map<string, RGBA>()

  const parseColor = (value: string): RGBA => {
    const cached = colorCache.get(value)
    if (cached) return cached
    if (!ctx || !value.trim()) return [0, 0, 0, 0]

    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.fillStyle = value
    ctx.fillRect(0, 0, 1, 1)

    const data = ctx.getImageData(0, 0, 1, 1).data
    const parsed: RGBA = [data[0] / 255, data[1] / 255, data[2] / 255, data[3] / 255]

    if (colorCache.size > 256) colorCache.clear()
    colorCache.set(value, parsed)
    return parsed
  }

  return (element: HTMLElement): { paint: ButtonGlassPaint; ink: RGB } | null => {
    const style = getComputedStyle(element)
    const ownColor = parseColor(style.backgroundColor)

    // Alpha-composite ancestors to compute backdrop scene color
    const layers: RGBA[] = []
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const parentStyle = getComputedStyle(parent)
      const bg = parseColor(parentStyle.backgroundColor)

      if (parentStyle.backgroundImage !== 'none' || parent.matches('video, canvas')) {
        if (ownColor[3] >= 0.99) {
          layers.push(ownColor)
          break
        }
        // Unknown photographic or video scene
        return null
      }

      layers.push(bg)
      if (bg[3] >= 0.99) break
    }

    const isDark =
      document.documentElement.dataset.theme === 'dark' ||
      window.matchMedia?.('(prefers-color-scheme: dark)').matches

    let scene: RGB = isDark ? [0.08, 0.12, 0.16] : [0.97, 0.98, 0.99]
    for (const layer of layers.reverse()) {
      scene = mix(layer, scene)
    }

    // Determine face color: inherit authored background tint or fallback to scene
    const face: RGB = ownColor[3] > 0.05 ? mix(ownColor, scene) : scene

    // Calculate compliant ink color
    const declaredInk = parseColor(style.color)
    const effectiveInk = mix(declaredInk, face)
    const ink = chooseGlassInk(effectiveInk, face)

    const rawRadius = parseFloat(style.borderTopLeftRadius) || 0
    const maxRadius = Math.min(element.clientHeight / 2, element.clientWidth / 2)
    const radius = Math.min(rawRadius, maxRadius)

    return {
      paint: {
        face,
        scene,
        radius,
        dark: luminance(scene) < 0.35,
      },
      ink,
    }
  }
}
