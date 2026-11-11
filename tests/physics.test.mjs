import test from 'node:test'
import assert from 'node:assert/strict'
import { stepSpring, createSpring, stepLiquidPhysics, createLiquidFluidState } from '../dist/index.js'

test('Spring Physics: createSpring initializes default values', () => {
  const spring = createSpring(0)
  assert.equal(spring.current, 0)
  assert.equal(spring.target, 0)
  assert.equal(spring.velocity, 0)
})

test('Spring Physics: Starts at initial value', () => {
  const spring = { current: 0, target: 1, velocity: 0 }
  assert.equal(spring.current, 0)
  assert.equal(spring.target, 1)
})

test('Spring Physics: Advances toward target over successive steps', () => {
  const spring = { current: 0, target: 1, velocity: 0 }
  const stillMoving = stepSpring(spring, 0.016)
  assert.ok(stillMoving)
  assert.ok(spring.current > 0)
})

test('Spring Physics: Reaches target and settles without diverging or oscillating indefinitely', () => {
  const spring = { current: 0, target: 1, velocity: 0 }
  let steps = 0
  let moving = true

  while (moving && steps < 500) {
    moving = stepSpring(spring, 0.016)
    steps++
  }

  assert.equal(moving, false, 'Spring must settle within 500 frames')
  assert.equal(spring.current, 1.0, 'Spring final value must equal target')
  assert.equal(spring.velocity, 0, 'Spring final velocity must be 0')
  assert.ok(steps < 120, `Spring settled in ${steps} frames (under 2 seconds)`)
})

test('Liquid Fluid Physics: createLiquidFluidState initializes 2D shear state', () => {
  const liquid = createLiquidFluidState(0)
  assert.equal(liquid.current, 0)
  assert.equal(liquid.target, 0)
  assert.equal(liquid.velocity, 0)
  assert.deepEqual(liquid.deformation, [0, 0])
  assert.deepEqual(liquid.fluidVelocity, [0, 0])
})

test('Liquid Fluid Physics: Responds to external 2D shear force and restores to equilibrium', () => {
  const liquid = createLiquidFluidState(0)
  liquid.target = 1.0

  // Apply a lateral swipe force [0.5, -0.2]
  const moving = stepLiquidPhysics(liquid, 0.016, [0.5, -0.2])
  assert.ok(moving)
  assert.ok(liquid.deformation[0] !== 0 || liquid.deformation[1] !== 0)

  // Step without force until equilibrium
  let steps = 0
  let isMoving = true
  while (isMoving && steps < 500) {
    isMoving = stepLiquidPhysics(liquid, 0.016, [0, 0])
    steps++
  }

  assert.equal(isMoving, false, 'Liquid physics must settle to rest')
  assert.equal(liquid.current, 1.0)
  assert.equal(liquid.deformation[0], 0)
  assert.equal(liquid.deformation[1], 0)
  assert.ok(steps < 150, `Liquid settled in ${steps} frames`)
})
