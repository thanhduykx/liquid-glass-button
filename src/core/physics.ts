/**
 * Interactive Spring Physics Simulation
 * 
 * Provides smooth, organic transitions for press, hover, and light angles
 * matching iOS spring curves (stiffness: 300, damping: 24).
 */

export interface SpringState {
  current: number
  target: number
  velocity: number
}

export function createSpring(initial: number = 0): SpringState {
  return {
    current: initial,
    target: initial,
    velocity: 0,
  }
}

/**
 * Steps a spring forward in time using an Euler integrator with sub-stepping for stability.
 * 
 * @param spring SpringState to update in place
 * @param dt Delta time in seconds (e.g. 0.016 for 60fps)
 * @param stiffness Spring stiffness coefficient (default: 300)
 * @param damping Spring damping coefficient (default: 24)
 * @returns true if spring is still moving, false if it has settled
 */
export function stepSpring(
  spring: SpringState,
  dt: number,
  stiffness: number = 300,
  damping: number = 24
): boolean {
  // Clamp delta time to avoid large jumps when tab resumes from background
  const clampedDt = Math.min(dt, 0.032)
  const steps = Math.ceil(clampedDt * 120)
  const subDt = clampedDt / steps

  for (let i = 0; i < steps; i++) {
    const force = (spring.target - spring.current) * stiffness - spring.velocity * damping
    spring.velocity += force * subDt
    spring.current += spring.velocity * subDt
  }

  // Check if settled
  const delta = Math.abs(spring.target - spring.current)
  const speed = Math.abs(spring.velocity)

  if (delta < 0.001 && speed < 0.001) {
    spring.current = spring.target
    spring.velocity = 0
    return false
  }

  return true
}
