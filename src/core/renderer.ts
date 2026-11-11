import { VERTEX_SHADER, FRAGMENT_SHADER } from './shader'
import type { ButtonGlassPaint } from './types'

export interface ButtonGlassRenderer {
  /**
   * Draw a shaded glass tile into the specified target 2D canvas.
   * 
   * @param target The target canvas element placed beneath the button
   * @param width Button width in CSS pixels
   * @param height Button height in CSS pixels
   * @param paint Evaluated optical paint properties (face, scene, radius, dark)
   * @param pressed Current spring press intensity [0.0..1.0]
   * @param light Normalized light direction vector [x, y]
   * @returns true if draw succeeded, false if context was lost or failed
   */
  draw(
    target: HTMLCanvasElement,
    width: number,
    height: number,
    paint: ButtonGlassPaint,
    pressed: number,
    light: [number, number]
  ): boolean

  /**
   * Release WebGL2 resources, event listeners, and delete programs.
   */
  dispose(): void
}

/**
 * Creates a single shared WebGL2 renderer instance for all liquid glass buttons.
 * Multiple buttons share this one GPU context, avoiding GPU context exhaustion.
 */
export function createButtonGlassRenderer(onContextLost?: () => void): ButtonGlassRenderer | null {
  if (typeof document === 'undefined') return null

  const surface = document.createElement('canvas')
  const gl = surface.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: 'low-power',
  })

  if (!gl) return null

  const program = gl.createProgram()
  const vao = gl.createVertexArray()
  if (!program || !vao) {
    if (program) gl.deleteProgram(program)
    if (vao) gl.deleteVertexArray(vao)
    return null
  }

  const shaders: WebGLShader[] = []
  let lost = false

  const contextLost = (event: Event) => {
    event.preventDefault()
    lost = true
    onContextLost?.()
  }

  const dispose = () => {
    surface.removeEventListener('webglcontextlost', contextLost)
    if (!gl.isContextLost()) {
      shaders.forEach((shader) => gl.deleteShader(shader))
      gl.deleteProgram(program)
      gl.deleteVertexArray(vao)
    }
  }

  try {
    const shaderSpecs = [
      [gl.VERTEX_SHADER, VERTEX_SHADER],
      [gl.FRAGMENT_SHADER, FRAGMENT_SHADER],
    ] as const

    for (const [type, source] of shaderSpecs) {
      const shader = gl.createShader(type)
      if (!shader) throw new Error('Shader creation failed')
      shaders.push(shader)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader)
        throw new Error(`Shader compile error: ${info}`)
      }
      gl.attachShader(program, shader)
    }

    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program)
      throw new Error(`Program link error: ${info}`)
    }
  } catch (err) {
    dispose()
    return null
  }

  surface.addEventListener('webglcontextlost', contextLost)

  const uniforms = {
    resolution: gl.getUniformLocation(program, 'resolution'),
    size: gl.getUniformLocation(program, 'size'),
    face: gl.getUniformLocation(program, 'face'),
    scene: gl.getUniformLocation(program, 'scene'),
    radius: gl.getUniformLocation(program, 'radius'),
    press: gl.getUniformLocation(program, 'press'),
    light: gl.getUniformLocation(program, 'light'),
    dark: gl.getUniformLocation(program, 'dark'),
    ior: gl.getUniformLocation(program, 'ior'),
    specularPower: gl.getUniformLocation(program, 'specularPower'),
    lipGlow: gl.getUniformLocation(program, 'lipGlow'),
    bevelIntensity: gl.getUniformLocation(program, 'bevelIntensity'),
    fresnelStrength: gl.getUniformLocation(program, 'fresnelStrength'),
  }

  return {
    draw(target, width, height, paint, pressed, light) {
      if (lost || gl.isContextLost()) return false

      // Device pixel ratio clamped for efficiency
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
      const ratio = Math.min(dpr, 2, 1024 / (width + 24), 256 / (height + 24))
      const w = Math.max(1, Math.ceil((width + 24) * ratio))
      const h = Math.max(1, Math.ceil((height + 24) * ratio))

      if (surface.width !== w || surface.height !== h) {
        surface.width = w
        surface.height = h
      }

      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.viewport(0, 0, w, h)

      gl.uniform2f(uniforms.resolution, w, h)
      gl.uniform2f(uniforms.size, width, height)
      gl.uniform3f(uniforms.face, paint.face[0], paint.face[1], paint.face[2])
      gl.uniform3f(uniforms.scene, paint.scene[0], paint.scene[1], paint.scene[2])
      gl.uniform1f(uniforms.radius, paint.radius)
      gl.uniform1f(uniforms.press, pressed)
      gl.uniform1f(uniforms.dark, paint.dark ? 1 : 0)
      gl.uniform2f(uniforms.light, light[0], light[1])

      // Physical optics parameters (default to optical crown glass standard)
      const optics = paint.optics || {}
      gl.uniform1f(uniforms.ior, optics.ior ?? 1.518)
      gl.uniform1f(uniforms.specularPower, optics.specularPower ?? 14.0)
      gl.uniform1f(uniforms.lipGlow, optics.lipGlow ?? 1.0)
      gl.uniform1f(uniforms.bevelIntensity, optics.bevelIntensity ?? 1.0)
      gl.uniform1f(uniforms.fresnelStrength, optics.fresnelStrength ?? 0.48)

      gl.drawArrays(gl.TRIANGLES, 0, 3)

      if (gl.getError() !== gl.NO_ERROR) return false

      const ctx2d = target.getContext('2d')
      if (!ctx2d) return false

      if (target.width !== w || target.height !== h) {
        target.width = w
        target.height = h
      }

      ctx2d.clearRect(0, 0, w, h)
      ctx2d.drawImage(surface, 0, 0)
      return true
    },
    dispose,
  }
}
