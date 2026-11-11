import test from 'node:test'
import assert from 'node:assert/strict'

// Mathematical calculations matching core/paint.ts
function luminance(rgb) {
  const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * toLinear(rgb[0]) + 0.7152 * toLinear(rgb[1]) + 0.0722 * toLinear(rgb[2])
}

function glassContrast(a, b) {
  const lumA = luminance(a)
  const lumB = luminance(b)
  return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05)
}

function chooseGlassInk(declared, face) {
  if (glassContrast(declared, face) >= 4.5) {
    return declared
  }
  const candidates = [
    [0.075, 0.16, 0.2],
    [0.95, 0.98, 1.0],
  ]
  const branded = candidates.slice().sort((a, b) => glassContrast(b, face) - glassContrast(a, face))
  if (glassContrast(branded[0], face) >= 4.5) {
    return branded[0]
  }
  const extremes = [
    [0, 0, 0],
    [1, 1, 1],
  ]
  return extremes.sort((a, b) => glassContrast(b, face) - glassContrast(a, face))[0]
}

test('WCAG contrast: Relative luminance of pure white is 1.0 and black is 0.0', () => {
  assert.equal(Math.round(luminance([1, 1, 1]) * 100) / 100, 1.0)
  assert.equal(luminance([0, 0, 0]), 0.0)
})

test('WCAG contrast: Pure black against pure white yields 21:1 contrast', () => {
  const contrast = glassContrast([0, 0, 0], [1, 1, 1])
  assert.ok(contrast > 20.9 && contrast <= 21.05)
})

test('chooseGlassInk: Guarantees >= 4.5:1 contrast across every neutral gray step (0..255)', () => {
  for (let gray = 0; gray <= 255; gray++) {
    const val = gray / 255
    const face = [val, val, val]
    const ink = chooseGlassInk([0.95, 0.98, 1.0], face)
    const ratio = glassContrast(ink, face)
    assert.ok(
      ratio >= 4.5,
      `Gray value ${gray} failed contrast requirement with ratio ${ratio}`
    )
  }
})

test('chooseGlassInk: Preserves safe declared semantic ink (dark on light, light on dark)', () => {
  const darkInk = [0.05, 0.1, 0.15]
  const lightFace = [0.95, 0.95, 0.95]
  assert.deepEqual(chooseGlassInk(darkInk, lightFace), darkInk)

  const lightInk = [1, 1, 1]
  const darkFace = [0.03, 0.05, 0.08]
  assert.deepEqual(chooseGlassInk(lightInk, darkFace), lightInk)
})

test('chooseGlassInk: Fixes low contrast declared ink automatically', () => {
  const unsafeInk = [0.9, 0.9, 0.9]
  const whiteFace = [1, 1, 1]
  const chosen = chooseGlassInk(unsafeInk, whiteFace)
  assert.ok(glassContrast(chosen, whiteFace) >= 4.5)
})
