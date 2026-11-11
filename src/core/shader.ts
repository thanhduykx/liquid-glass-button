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
 * 2. 3D Convex Dome Height Map: smooth continuous surface curvature at edges.
 * 3. Surface Normal calculation via central difference gradient of height function.
 * 4. Snell's Law Refraction: ray tracing ray through glass with refractive index n = 1.518.
 * 5. Schlick's Approximation for Fresnel Reflection: reflectance increases near grazing angles.
 * 6. Dynamic Specular Softbox Highlight: interactive light vector tracks cursor / pointer coordinates.
 * 7. Bevel & Lip Edge Highlighting: sharp convex boundary rim mimicking Apple iOS & visionOS glass edges.
 * 8. Directional Ambient Contact Shadow: smooth quadratic drop shadow beneath button.
 * 9. Sub-pixel Edge Anti-aliasing using screen-space derivative fwidth(d).
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

out vec4 pixel;

// 2D Rounded Box Signed Distance Field (SDF)
float sdf(vec2 p) {
  vec2 q = abs(p) - size * 0.5 + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

// 3D Dome Height Field
// Creates a smooth convex lens dome along the perimeter bevel
float heightAt(vec2 p) {
  float maxDepth = min(8.0, size.y * 0.22);
  float t = clamp(-sdf(p) / maxDepth, 0.0, 1.0);
  return sqrt(max(0.0, 1.0 - (1.0 - t) * (1.0 - t)));
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

  // Surface normal vector pointing upwards out of the screen (+Z)
  vec3 n = normalize(vec3(-grad * 6.0, 1.0));

  // Incident ray from camera towards surface: (0, 0, -1)
  vec3 incident = vec3(0.0, 0.0, -1.0);

  // Snell's Law refraction with Crown Glass IOR = 1.518 (eta = 1.0 / ior)
  vec3 ray = refract(incident, n, 1.0 / max(1.0, ior));

  // Reflection vector
  vec3 reflection = reflect(incident, n);

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

  // Specular softbox highlight: reacts dynamically to light position (cursor tracking)
  vec3 lightDir = normalize(vec3(light, 1.7));
  float specDot = max(0.0, dot(reflection, lightDir));
  float softbox = pow(specDot, max(1.0, specularPower));
  color += vec3(softbox * bevel * 0.17 * (1.0 + press * 0.2));

  // Outer convex edge lip highlighting: gives Apple's characteristic sharp glass edge
  float lip = exp(-pow((d + 0.8) / 0.9, 2.0));
  float key = 0.22 + 0.62 * max(0.0, n.y) + 0.16 * max(0.0, -n.x);
  color = mix(color, vec3(1.0), lip * key * lipGlow * mix(0.63, 0.32, dark));

  // Subtle interior darkening on the bevel curve
  color *= 1.0 - bevel * 0.045 * bevelIntensity;

  // Dispersion chromatic fringe along refractive bend
  color += vec3(ray.x * 0.0003, 0.0, -ray.x * 0.0003) * bevel;

  // Micro border rim
  float border = 1.0 - smoothstep(0.15, 0.7, abs(d + 0.25));
  vec3 rimTint = mix(vec3(0.39, 0.48, 0.49), vec3(0.70, 0.83, 0.85), dark);
  color = mix(color, rimTint, border * 0.2);

  // Anti-aliased outer boundary output
  float alpha = 1.0 - smoothstep(-aa * 0.5, aa * 0.5, d);
  pixel = vec4(clamp(color, 0.0, 1.0), alpha);
}
`
