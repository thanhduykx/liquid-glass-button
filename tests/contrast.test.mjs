import test from 'node:test'
import assert from 'node:assert/strict'
import { luminance, glassContrast, chooseGlassInk, mix, cssColor } from '../dist/index.js'

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

test('Color utils: mix and cssColor produce valid mathematical outputs', () => {
  const blended = mix([1, 0, 0, 0.5], [0, 0, 1])
  assert.deepEqual(blended, [0.5, 0, 0.5])
  assert.equal(cssColor([1, 0, 0]), 'rgb(255 0 0)')
  assert.equal(cssColor([0, 0.5, 1]), 'rgb(0 128 255)')
})
