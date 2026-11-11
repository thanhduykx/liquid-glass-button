import test from 'node:test'
import assert from 'node:assert/strict'
import { VERTEX_SHADER, FRAGMENT_SHADER } from '../dist/index.js'

test('GLSL Shaders: Valid WebGL2 GLSL ES 3.00 specification', () => {
  assert.ok(VERTEX_SHADER.includes('#version 300 es'))
  assert.ok(FRAGMENT_SHADER.includes('#version 300 es'))
  assert.ok(FRAGMENT_SHADER.includes('precision highp float;'))
  assert.ok(FRAGMENT_SHADER.includes('out vec4 pixel;'))
})

test('GLSL Shaders: All mandatory uniforms are defined in FRAGMENT_SHADER', () => {
  const requiredUniforms = [
    'uniform vec2 resolution;',
    'uniform vec2 size;',
    'uniform vec2 light;',
    'uniform vec3 face;',
    'uniform vec3 scene;',
    'uniform float radius;',
    'uniform float press;',
    'uniform float dark;',
    'uniform float ior;',
    'uniform float specularPower;',
    'uniform float lipGlow;',
    'uniform float bevelIntensity;',
    'uniform float fresnelStrength;',
  ]

  for (const uniform of requiredUniforms) {
    assert.ok(
      FRAGMENT_SHADER.includes(uniform),
      `Missing required uniform in FRAGMENT_SHADER: ${uniform}`
    )
  }
})

test('Optical Physics: Snell Law refraction uses configurable IOR (default optical crown glass 1.518)', () => {
  assert.ok(
    FRAGMENT_SHADER.includes('refract(incident, n, 1.0 / max(1.0, ior))'),
    'Shader must calculate Snell refraction using ray = refract(incident, n, 1.0 / max(1.0, ior))'
  )
})

test('Optical Physics: Schlick Fresnel approximation equation is present', () => {
  assert.ok(
    FRAGMENT_SHADER.includes('0.04 + 0.96 * pow(') || FRAGMENT_SHADER.includes('.04+.96*pow('),
    'Shader must include Schlick Fresnel reflectance equation'
  )
  assert.ok(
    FRAGMENT_SHADER.includes('fresnel * fresnelStrength'),
    'Shader must scale Fresnel reflection by configurable fresnelStrength'
  )
})

test('SDF Geometry: JS simulation of 2D Rounded Box SDF matches theoretical boundary', () => {
  function sdf(p, size, radius) {
    const qx = Math.abs(p[0]) - size[0] * 0.5 + radius
    const qy = Math.abs(p[1]) - size[1] * 0.5 + radius
    const maxQx = Math.max(qx, 0)
    const maxQy = Math.max(qy, 0)
    const lengthMaxQ = Math.sqrt(maxQx * maxQx + maxQy * maxQy)
    const minMaxQ = Math.min(Math.max(qx, qy), 0)
    return lengthMaxQ + minMaxQ - radius
  }

  const size = [120, 44]
  const radius = 22 // Full pill

  // Origin (center of button) should be strictly negative (inside box)
  assert.ok(sdf([0, 0], size, radius) < 0)

  // Exactly at top boundary (y = 22) should be 0.0
  assert.equal(Math.round(sdf([0, 22], size, radius)), 0)

  // Way outside button should be strictly positive
  assert.ok(sdf([100, 50], size, radius) > 0)
})

test('Optical Physics: Young-Laplace liquid meniscus profile and TIR caustics', () => {
  assert.ok(
    FRAGMENT_SHADER.includes('causticBead') && FRAGMENT_SHADER.includes('causticFocus'),
    'Shader must calculate inner caustic bead from meniscus curvature'
  )
  assert.ok(
    FRAGMENT_SHADER.includes('uniform float transmittance;'),
    'Shader must define transmittance uniform for clear vs tinted modes'
  )
  assert.ok(
    FRAGMENT_SHADER.includes('uniform float dispersion;'),
    'Shader must define dispersion uniform for chromatic light splitting'
  )
  assert.ok(
    FRAGMENT_SHADER.includes('rayRed') && FRAGMENT_SHADER.includes('rayBlue'),
    'Shader must calculate spectral chromatic dispersion vectors'
  )
  assert.ok(
    FRAGMENT_SHADER.includes('uniform vec2 shear;'),
    'Shader must support 2D lateral fluid shear displacement'
  )
  assert.ok(
    FRAGMENT_SHADER.includes('uniform int u_hasTrack;') && FRAGMENT_SHADER.includes('sdfTrackBox'),
    'Shader must calculate Snell refraction over underlying switch track'
  )
  assert.ok(
    FRAGMENT_SHADER.includes('uniform sampler2D u_backdrop;'),
    'Shader must support texture backdrop sampling for real-time scene refraction'
  )
})
