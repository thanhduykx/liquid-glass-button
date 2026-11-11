import test from 'node:test'
import assert from 'node:assert/strict'

function stepSpring(spring, dt, stiffness = 300, damping = 24) {
  const clampedDt = Math.min(dt, 0.032)
  const steps = Math.ceil(clampedDt * 120)
  const subDt = clampedDt / steps

  for (let i = 0; i < steps; i++) {
    const force = (spring.target - spring.current) * stiffness - spring.velocity * damping
    spring.velocity += force * subDt
    spring.current += spring.velocity * subDt
  }

  const delta = Math.abs(spring.target - spring.current)
  const speed = Math.abs(spring.velocity)

  if (delta < 0.001 && speed < 0.001) {
    spring.current = spring.target
    spring.velocity = 0
    return false
  }

  return true
}

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
