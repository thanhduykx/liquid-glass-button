import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import * as esmModule from '../dist/index.js'

const require = createRequire(import.meta.url)
const cjsModule = require('../dist/index.cjs')

const EXPECTED_EXPORTS = [
  'LiquidGlassButton',
  'LiquidGlassToggle',
  'LiquidGlassEffects',
  'LiquidGlassController',
  'DEFAULT_SELECTOR',
  'DEFAULT_EXCLUSIONS',
  'createButtonGlassRenderer',
  'createButtonPaintReader',
  'createSpring',
  'stepSpring',
  'stepLiquidPhysics',
  'createLiquidFluidState',
  'luminance',
  'glassContrast',
  'chooseGlassInk',
  'mix',
  'cssColor',
  'VERTEX_SHADER',
  'FRAGMENT_SHADER',
]

test('Package Exports: ESM exposes all core components, shaders, and utilities', () => {
  for (const name of EXPECTED_EXPORTS) {
    assert.ok(name in esmModule, `Missing ESM export: ${name}`)
    assert.notEqual(esmModule[name], undefined)
  }
})

test('Package Exports: CommonJS bundle exposes all core components, shaders, and utilities', () => {
  for (const name of EXPECTED_EXPORTS) {
    assert.ok(name in cjsModule, `Missing CJS export: ${name}`)
    assert.notEqual(cjsModule[name], undefined)
  }
})

test('Backdrop & Paint Reader: Does not crash in Node.js server environment', () => {
  const reader = esmModule.createButtonPaintReader()
  // When document is undefined (SSR / Node), reader returns a graceful null function without throwing
  assert.equal(typeof reader, 'function')
  assert.equal(reader({}), null)
})
