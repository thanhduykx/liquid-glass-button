/**
 * Interactive Spring & Liquid Viscous Physics Simulation
 * 
 * Provides smooth, organic transitions for press, hover, drag, and light angles
 * matching iOS fluid spring curves (stiffness: 300, damping: 24) and Young-Laplace
 * liquid surface tension dynamics.
 */

export interface SpringState {
  current: number
  target: number
  velocity: number
}

export interface LiquidPhysicsConfig {
  /** Elastic restoring stiffness coefficient (default: 300) */
  stiffness?: number
  /** Viscous damping coefficient (default: 24) */
  damping?: number
  /** Effective drop mass (default: 1.0) */
  mass?: number
  /** Young-Laplace interfacial surface tension coefficient (default: 0.85) */
  surfaceTension?: number
  /** Dynamic fluid shear viscosity (default: 0.12) */
  viscosity?: number
}

export interface LiquidFluidState extends SpringState {
  /** 2D lateral shear displacement [dx, dy] */
  deformation: [number, number]
  /** 2D internal fluid velocity */
  fluidVelocity: [number, number]
}

export function createSpring(initial: number = 0): SpringState {
  return {
    current: initial,
    target: initial,
    velocity: 0,
  }
}

export function createLiquidFluidState(initial: number = 0): LiquidFluidState {
  return {
    current: initial,
    target: initial,
    velocity: 0,
    deformation: [0, 0],
    fluidVelocity: [0, 0],
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

/**
 * Simulates visco-elastic liquid physics including 1D compression spring
 * and 2D lateral shear deformation governed by Young-Laplace surface tension.
 * 
 * @param state LiquidFluidState to update in place
 * @param dt Delta time in seconds
 * @param targetForce External 2D lateral excitation force (e.g. cursor drag velocity)
 * @param config Optional physics parameters
 * @returns true if fluid is still moving, false if settled
 */
export function stepLiquidPhysics(
  state: LiquidFluidState,
  dt: number,
  targetForce: [number, number] = [0, 0],
  config: LiquidPhysicsConfig = {}
): boolean {
  const stiffness = config.stiffness ?? 300
  const damping = config.damping ?? 24
  const mass = Math.max(0.1, config.mass ?? 1.0)
  const surfaceTension = config.surfaceTension ?? 0.85
  const viscosity = config.viscosity ?? 0.12

  // 1. Step standard 1D compression spring
  const compressionActive = stepSpring(state, dt, stiffness, damping)

  // 2. Step 2D fluid shear deformation with surface tension restoration
  const clampedDt = Math.min(dt, 0.032)
  const steps = Math.max(1, Math.ceil(clampedDt * 120))
  const subDt = clampedDt / steps

  for (let i = 0; i < steps; i++) {
    for (let axis = 0; axis < 2; axis++) {
      // Surface tension acts to restore equilibrium (deformation -> 0)
      const restoring = -state.deformation[axis] * (stiffness * surfaceTension)
      const viscousDrag = -state.fluidVelocity[axis] * (damping * (1.0 + viscosity))
      const external = targetForce[axis] * 50.0

      const totalForce = (restoring + viscousDrag + external) / mass
      state.fluidVelocity[axis] += totalForce * subDt
      state.deformation[axis] += state.fluidVelocity[axis] * subDt
    }
  }

  const defMag = Math.hypot(state.deformation[0], state.deformation[1])
  const velMag = Math.hypot(state.fluidVelocity[0], state.fluidVelocity[1])

  let shearActive = true
  if (defMag < 0.001 && velMag < 0.001 && Math.hypot(targetForce[0], targetForce[1]) < 0.0001) {
    state.deformation[0] = 0
    state.deformation[1] = 0
    state.fluidVelocity[0] = 0
    state.fluidVelocity[1] = 0
    shearActive = false
  }

  return compressionActive || shearActive
}
