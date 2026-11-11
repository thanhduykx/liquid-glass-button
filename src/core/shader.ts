/**
 * Vertex Shader for Liquid Glass Button Tile
 * 
 * Generates a full-viewport triangle covering the button bounds without needing
 * index buffers or vertex attributes, taking advantage of gl_VertexID.
 */
export const VERTEX_SHADER = `#version 300 es
// Full-screen triangle covering [-1, 1] NDC
const vec2 P[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2( 3.0, -1.0),
  vec2(-1.0,  3.0)
);

void main() {
  gl_Position = vec4(P[gl_VertexID], 0.0, 1.0);
}
`

/**
 * Fragment Shader for Liquid Glass Button Tile
 * 
 * Physical Principles Implemented:
 * 1. Signed Distance Field (SDF) of rounded rectangle representing the button tile.
 * 2. 3D Young-Laplace Liquid Meniscus Height Map: realistic capillary curvature with central optical plateau.
 * 3. Surface Normal calculation via central difference gradient with compression elasticity.
 * 4. Snell's Law Refraction: ray tracing through crown glass (n = 1.518).
 * 5. Schlick's Approximation for Fresnel Reflection: reflectance spikes near grazing angles.
 * 6. Dynamic Specular Highlights: dual-source interactive cursor tracking + overhead ambient key light.
 * 7. Concentrated Inner Caustic Bead: simulates Total Internal Reflection (TIR) and lens meniscus focus.
 * 8. Convex Lip Edge Highlighting: sharp perimeter boundary mimicking Apple iOS & visionOS liquid glass.
 * 9. Chromatic Dispersion: Cauchy-approximated spectral wavelength splitting (red/blue fringe).
 * 10. Physical Transmittance Model: continuous control between "Trong suốt" (Clear) and "Phủ màu" (Tinted).
 * 11. Directional Ambient Contact Shadow: smooth quadratic drop shadow beneath button.
 * 12. Sub-pixel Edge Anti-aliasing using screen-space derivative fwidth(d).
 */
export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

// Uniforms
uniform vec2 resolution;   // Canvas resolution in physical pixels
uniform vec2 size;         // Unpadded button size [width, height] in CSS pixels
uniform vec2 light;        // Normalized interactive light direction [-0.5..0.5, -0.5..0.5]
uniform vec3 face;         // Surface face tint color [r, g, b]
uniform vec3 scene;        // Backdrop scene color behind button [r, g, b]
uniform float radius;      // Corner radius in pixels
uniform float press;       // Spring pressed state [0.0..1.0]
uniform float dark;        // Whether scene is in dark mode (1.0 = dark, 0.0 = light)
uniform float ior;             // Index of refraction (default 1.518)
uniform float specularPower;   // Specular exponent (default 14.0)
uniform float lipGlow;         // Rim lip glow brightness (default 1.0)
uniform float bevelIntensity;  // Bevel curve intensity (default 1.0)
uniform float fresnelStrength; // Fresnel reflection strength (default 0.48)
uniform float transmittance;   // Optical transmission [0.0..1.0] (default: 0.82 clear, 0.22 tinted)
uniform float dispersion;      // Chromatic dispersion intensity (default 1.0)
uniform float causticStrength; // Inner caustic bead focus intensity (default 1.0)

out vec4 pixel;

// 2D Rounded Box Signed Distance Field (SDF)
float sdf(vec2 p) {
  vec2 q = abs(p) - size * 0.5 + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

// 3D Liquid Meniscus Profile (Young-Laplace fluidic meniscus)
// Creates an optically clear central plateau and a steep curved liquid meniscus at the perimeter
float heightAt(vec2 p) {
  float maxDepth = min(9.5, size.y * 0.28);
  float t = clamp(-sdf(p) / maxDepth, 0.0, 1.0);
  // Quartic fluidic roll-off for organic liquid glass profile
  float curve = 1.0 - pow(1.0 - t, 3.2);
  return sqrt(max(0.0, curve * (2.0 - curve)));
}

void main() {
  // Map fragment coordinates to centered pixel coordinates with 12px margin on each side
  vec2 p = (gl_FragCoord.xy / resolution - 0.5) * (size + vec2(24.0));
  float d = sdf(p);
  float aa = max(fwidth(d), 0.3);

  // Outside the button: calculate subtle directional contact drop shadow
  if (d > aa) {
    float ds = max(sdf(p - vec2(0.0, -2.5)), 0.0);
    float shadow = exp(-ds * ds / 25.0) * mix(0.12, 0.23, dark);
    pixel = vec4(vec3(0.0), shadow);
    return;
  }

  // Calculate surface gradient for 3D normal vector
  float h = heightAt(p);
  float e = 0.35;
  vec2 grad = vec2(
    heightAt(p + vec2(e, 0.0)) - heightAt(p - vec2(e, 0.0)),
    heightAt(p + vec2(0.0, e)) - heightAt(p - vec2(0.0, e))
  ) / (2.0 * e);

  // Surface normal vector with pressure elastic flattening
  float domeFactor = (6.0 - press * 0.75) * bevelIntensity;
  vec3 n = normalize(vec3(-grad * domeFactor, 1.0));

  // Incident ray from camera towards surface: (0, 0, -1)
  vec3 incident = vec3(0.0, 0.0, -1.0);

  // Snell's Law refraction with Crown Glass IOR = 1.518 (eta = 1.0 / ior)
  vec3 ray = refract(incident, n, 1.0 / max(1.0, ior));

  // Reflection vector
  vec3 reflection = reflect(incident, n);

  // Chromatic dispersion (spectral wavelength splitting)
  float dEta = 0.022 * dispersion;
  vec3 rayRed = refract(incident, n, 1.0 / max(1.0, ior - dEta));
  vec3 rayBlue = refract(incident, n, 1.0 / max(1.0, ior + dEta));

  // Schlick's approximation for Fresnel reflectance
  // R(theta) = R0 + (1 - R0) * (1 - cos(theta))^5
  // For crown glass in air, R0 ~ 0.04
  float cosTheta = 1.0 - n.z;
  float fresnel = 0.04 + 0.96 * pow(cosTheta, 5.0);

  // Environmental ambient lighting transmission
  vec3 environment = mix(scene, vec3(1.0), 0.24 + 0.24 * max(0.0, reflection.y));
  vec3 color = mix(face, environment, fresnel * fresnelStrength);

  // Bevel factor (1.0 at outer edge, 0.0 at flat center plateau)
  float bevel = 1.0 - h;

  // Dual-source specular highlights: interactive cursor light + ambient key light
  vec3 lightDir = normalize(vec3(light, 1.7));
  float specDot = max(0.0, dot(reflection, lightDir));
  float softbox = pow(specDot, max(1.0, specularPower));

  vec3 keyLightDir = normalize(vec3(-0.22, 0.65, 1.45));
  float specDot2 = max(0.0, dot(reflection, keyLightDir));
  float softbox2 = pow(specDot2, max(1.0, specularPower * 1.3));

  color += vec3((softbox * 0.75 + softbox2 * 0.35) * bevel * 0.22 * (1.0 + press * 0.25));

  // Concentrated inner caustic light bead (Total Internal Reflection & Meniscus Focus)
  float causticOffset = min(4.8, size.y * 0.13);
  float causticDist = d + causticOffset;
  float causticBead = exp(-pow(causticDist / 1.7, 2.0));
  float causticFocus = pow(clamp(1.0 - n.z, 0.0, 1.0), 1.5) * causticBead * causticStrength;
  vec3 causticColor = mix(vec3(0.92, 0.98, 1.0), vec3(1.0, 1.0, 1.0), dark);
  color += causticColor * (causticFocus * 0.55 * lipGlow);

  // Outer convex edge lip highlighting: gives Apple's characteristic sharp glass edge
  float lip = exp(-pow((d + 0.8) / 0.9, 2.0));
  float key = 0.22 + 0.62 * max(0.0, n.y) + 0.16 * max(0.0, -n.x);
  color = mix(color, vec3(1.0), lip * key * lipGlow * mix(0.63, 0.32, dark));

  // Subtle interior darkening on the bevel curve
  color *= 1.0 - bevel * 0.045 * bevelIntensity;

  // Dispersion chromatic fringe along refractive bend
  vec3 dispersionFringe = vec3(rayRed.x - ray.x, 0.0, rayBlue.x - ray.x) * (bevel * 0.18 * dispersion);
  color += dispersionFringe;

  // Micro border rim
  float border = 1.0 - smoothstep(0.15, 0.7, abs(d + 0.25));
  vec3 rimTint = mix(vec3(0.39, 0.48, 0.49), vec3(0.70, 0.83, 0.85), dark);
  color = mix(color, rimTint, border * 0.2);

  // Physical Transmittance:
  // transmittance = 1.0 ("Trong suốt" / Clear Glass mode): high transmission
  // transmittance = 0.0 ("Phủ màu" / Tinted Glass mode): high opacity/contrast
  float clearAlpha = mix(0.24, 0.36, dark);
  float tintedAlpha = mix(0.74, 0.86, dark);
  float baseAlpha = mix(tintedAlpha, clearAlpha, clamp(transmittance, 0.0, 1.0));
  float edgeAlpha = mix(0.85, 0.96, fresnel);
  float glassAlpha = mix(baseAlpha, edgeAlpha, clamp(bevel * 0.75 + fresnel * fresnelStrength, 0.0, 1.0));

  // Anti-aliased outer boundary output
  float alpha = (1.0 - smoothstep(-aa * 0.5, aa * 0.5, d)) * glassAlpha;
  pixel = vec4(clamp(color, 0.0, 1.0), alpha);
}
`
