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
   * @param shear Visco-elastic fluid shear displacement [dx, dy]
   * @returns true if draw succeeded, false if context was lost or failed
   */
  draw(
    target: HTMLCanvasElement,
    width: number,
    height: number,
    paint: ButtonGlassPaint,
    pressed: number,
    light: [number, number],
    shear?: [number, number]
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
  const backdropTexture = gl.createTexture()
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
      if (backdropTexture) gl.deleteTexture(backdropTexture)
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
    transmittance: gl.getUniformLocation(program, 'transmittance'),
    dispersion: gl.getUniformLocation(program, 'dispersion'),
    causticStrength: gl.getUniformLocation(program, 'causticStrength'),
    shear: gl.getUniformLocation(program, 'shear'),
    u_hasBackdrop: gl.getUniformLocation(program, 'u_hasBackdrop'),
    u_backdrop: gl.getUniformLocation(program, 'u_backdrop'),
    u_hasTrack: gl.getUniformLocation(program, 'u_hasTrack'),
    u_trackConfig: gl.getUniformLocation(program, 'u_trackConfig'),
    u_trackRadius: gl.getUniformLocation(program, 'u_trackRadius'),
    u_trackColor: gl.getUniformLocation(program, 'u_trackColor'),
    u_trackBgColor: gl.getUniformLocation(program, 'u_trackBgColor'),
  }

  return {
    draw(target, width, height, paint, pressed, light, shear = [0, 0]) {
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
      gl.uniform2f(uniforms.shear, shear[0] || 0, shear[1] || 0)

      // Physical optics parameters (default to optical crown glass standard)
      const optics = paint.optics || {}
      gl.uniform1f(uniforms.ior, optics.ior ?? 1.518)
      gl.uniform1f(uniforms.specularPower, optics.specularPower ?? 14.0)
      gl.uniform1f(uniforms.lipGlow, optics.lipGlow ?? 1.0)
      gl.uniform1f(uniforms.bevelIntensity, optics.bevelIntensity ?? 1.0)
      gl.uniform1f(uniforms.fresnelStrength, optics.fresnelStrength ?? 0.48)

      // Optical transmission mode: 'clear' ("Trong suốt") vs 'tinted' ("Phủ màu")
      let defaultTransmittance = 0.52
      if (optics.mode === 'clear') defaultTransmittance = 0.82
      else if (optics.mode === 'tinted') defaultTransmittance = 0.18

      gl.uniform1f(uniforms.transmittance, optics.transmittance ?? defaultTransmittance)
      gl.uniform1f(uniforms.dispersion, optics.dispersion ?? 1.0)
      gl.uniform1f(uniforms.causticStrength, optics.causticStrength ?? 1.0)

      // Underlying track refraction (for authentic liquid glass toggle switches)
      if (optics.track) {
        gl.uniform1i(uniforms.u_hasTrack, 1)
        gl.uniform4f(
          uniforms.u_trackConfig,
          optics.track.size[0],
          optics.track.size[1],
          optics.track.offset[0],
          optics.track.offset[1]
        )
        gl.uniform1f(uniforms.u_trackRadius, optics.track.radius)
        gl.uniform3f(uniforms.u_trackColor, optics.track.color[0], optics.track.color[1], optics.track.color[2])
        gl.uniform3f(
          uniforms.u_trackBgColor,
          optics.track.bgColor[0],
          optics.track.bgColor[1],
          optics.track.bgColor[2]
        )
      } else {
        gl.uniform1i(uniforms.u_hasTrack, 0)
      }

      // Real-time backdrop scene refraction
      if (optics.backdropCanvas && backdropTexture) {
        gl.uniform1i(uniforms.u_hasBackdrop, 1)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, backdropTexture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, optics.backdropCanvas)
        gl.uniform1i(uniforms.u_backdrop, 0)
      } else {
        gl.uniform1i(uniforms.u_hasBackdrop, 0)
      }

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
