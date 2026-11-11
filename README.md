#  Liquid Glass Button

> **Ultra-realistic refractive liquid glass button developed by [Dương Thành Thanh Duy (@thanhduykx)](https://github.com/thanhduykx), re-developed based on Apple's Liquid Glass UI specification and Human Interface Guidelines (HIG Materials).**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebGL2](https://img.shields.io/badge/WebGL2-Shader%20Powered-990000?logo=webgl&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext)
[![WCAG AA](https://img.shields.io/badge/WCAG%20AA-Contrast%20≥%204.5%3A1-success)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Author](https://img.shields.io/badge/Author-Dương%20Thành%20Thanh%20Duy-0071e3)](https://github.com/thanhduykx)

---

## 📖 English Overview

**Liquid Glass Button** brings the cutting-edge optical aesthetics of Apple's Liquid Glass (visionOS / iOS HIG Materials) to the modern web. Built on custom WebGL2 shaders, physical Snell's Law refraction, Schlick's Fresnel reflection, and dynamic pointer tracking, it transforms plain static buttons into living optical glass lenses.

Unlike superficial CSS `backdrop-filter: blur()` glassmorphism, Liquid Glass Button simulates true 3D surface curvature, normal vector derivation, and chromatic light dispersion while keeping foreground typography, icons, and badges 100% sharp and accessible.

### 🌟 Key Highlights

- **Snell's Law Refraction ($n = 1.518$)**: True optical refraction using Crown Glass index of refraction.
- **Dynamic Specular Softbox**: Real-time cursor/pointer tracking creates realistic specular glints that react to user gestures.
- **Schlick's Fresnel Approximation**: Grazing angles naturally exhibit increased reflectance, reproducing Apple's signature rim lighting.
- **Convex Bevel & Micro Lip**: Precise height map gradient mapping produces the distinctive sharp glass boundary seen in Apple UI.
- **Pooled WebGL2 Architecture (0% Idle GPU)**: All buttons on a page share a single WebGL2 context; rendering is strictly event-driven with 0 FPS / 0% GPU utilization when idle.
- **Zero Text Rasterization**: Labels and icons remain native DOM nodes—100% accessible to screen readers, crisp on high-DPI displays, and selectable.
- **Guaranteed WCAG AA Contrast**: Built-in dynamic relative luminance analyzer computes compliant text ink (contrast $\ge 4.5:1$) across light mode, dark mode, and vibrant backdrops.
- **Universal Compatibility**: Works seamlessly with **React**, **Vue**, **Svelte**, **Angular**, or **Vanilla JavaScript**.

---

## 🇻🇳 Giới thiệu (Vietnamese)

**Liquid Glass Button** là thư viện nút bấm hiệu ứng kính lỏng (Liquid Glass) quang học siêu thực, được nghiên cứu và phát triển bởi **Dương Thành Thanh Duy (@thanhduykx)** dựa trên ngôn ngữ thiết kế Liquid Glass và chuẩn Material của Apple (visionOS & iOS Human Interface Guidelines).

Thay vì chỉ dùng CSS `backdrop-filter` mờ đơn giản, thư viện ứng dụng shader WebGL2 tính toán khúc xạ ánh sáng theo **Định luật Snell** với chiết suất thuỷ tinh quang học ($n = 1.518$), phản xạ góc **Fresnel của Schlick**, viền nổi gờ kính convex lip, và ánh sáng softbox phản hồi theo vị trí con trỏ chuột. Chữ và icon được giữ nguyên vẹn ở tầng DOM gốc, hoàn toàn sắc nét và đáp ứng tiêu chuẩn tiếp cận **WCAG AA**.

---

## 🔬 Physical Optics & Architecture

```
               [ User Eye / Camera ]
                        │
                        ▼  Incident Ray (0, 0, -1)
             ╭─────────────────────╮
             │  Native DOM Text    │  <-- 100% Sharp, WCAG AA ≥ 4.5:1 Ink
    ┌────────┴─────────────────────┴────────┐
    │  ╭─────────────────────────────────╮  │  <-- Micro Lip & Specular Highlight
    │  │   3D Convex Dome Height Field   │  │
    │  ╰─────────────────────────────────╯  │
    │      n₁ = 1.0 (Air)                   │
    ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤  <-- Normal Vector n = normalize(-grad * 6, 1)
    │      n₂ = 1.518 (Crown Glass)         │
    │                                       │  <-- Snell Refraction: ray = refract(I, n, 1/1.518)
    │   Schlick Fresnel: R(θ) = R₀+(1-R₀)(1-cos θ)⁵
    └───────────────────────────────────────┘
                        │
                        ▼  Backdrop Scene Alpha Composite
```

### 1. Snell's Law Refraction
Refraction angle is governed by Snell's Law:
$$n_1 \sin(\theta_1) = n_2 \sin(\theta_2)$$
Using $n_{\text{glass}} = 1.518$, the GLSL shader computes exact refractive deflection rays (`refract(incident, normal, 1.0 / 1.518)`), creating a natural optical lens curvature around the button's perimeter.

### 2. Schlick's Fresnel Reflectance
Reflectance $R(\theta)$ increases near grazing angles according to Schlick's approximation:
$$R(\theta) = R_0 + (1 - R_0)(1 - \cos\theta)^5$$
For crown glass in air, $R_0 \approx 0.04$. At normal incidence, the surface transmits scene radiance; towards the edges, reflectivity spikes, creating the crisp metallic-glass perimeter sheen.

### 3. Pooled Single-Context Engine
Creating a `WebGLRenderingContext` per button quickly causes browser crashes due to GPU context limits (typically 8–16 max). Liquid Glass Button solves this by utilizing **one shared WebGL2 context** across all buttons on the page, rendering offscreen tiles copied to lightweight 2D backing surfaces.

### 4. Zero Idle GPU Consumption
The internal render loop is completely **event-driven**. When buttons are resting, `requestAnimationFrame` is cancelled. Frame updates fire only during pointer interactions, physical spring compression, or viewport resizing.

---

## 🚀 Quick Start

### Installation

```bash
npm install liquid-glass-button
```

Or with Yarn / PNPM:

```bash
yarn add liquid-glass-button
# or
pnpm add liquid-glass-button
```

---

## 💻 Usage

### 1. React Component

```tsx
import { LiquidGlassButton } from 'liquid-glass-button'
import 'liquid-glass-button/style.css'

export default function MyComponent() {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Default translucent glass */}
      <LiquidGlassButton onClick={() => console.log('Clicked!')}>
        Explore Space
      </LiquidGlassButton>

      {/* Primary Apple Blue tint */}
      <LiquidGlassButton variant="primary" size="md">
        Continue
      </LiquidGlassButton>

      {/* Emerald Accent */}
      <LiquidGlassButton variant="accent">
        Confirm Booking
      </LiquidGlassButton>

      {/* Destructive Red */}
      <LiquidGlassButton variant="danger">
        Delete Post
      </LiquidGlassButton>

      {/* Custom Corner Radius */}
      <LiquidGlassButton radius={16}>
        Rounded Rect (16px)
      </LiquidGlassButton>
    </div>
  )
}
```

### 2. Global Provider / Enhancer (Any HTML or Framework)

If you have existing HTML or JSX buttons and want to enhance them automatically without rewriting components:

```tsx
import { LiquidGlassEffects } from 'liquid-glass-button'
import 'liquid-glass-button/style.css'

export default function App() {
  return (
    <>
      <LiquidGlassEffects />
      
      {/* Any button with .liquid-glass-btn or data-liquid-glass will be shaded */}
      <button className="liquid-glass-btn">Standard Button</button>
      <button data-liquid-glass="" className="btn-primary">Custom Button</button>
    </>
  )
}
```

### 3. Vanilla JavaScript / TypeScript

```html
<link rel="stylesheet" href="node_modules/liquid-glass-button/dist/liquid-glass-button.css">

<button class="liquid-glass-btn">Vanilla Glass</button>

<script type="module">
  import { LiquidGlassController } from 'liquid-glass-button'

  // Initialize controller on the document
  const controller = new LiquidGlassController({
    selector: '.liquid-glass-btn',
  })

  // To cleanup on page unload / SPA destroy:
  // controller.destroy()
</script>
```

---

## ⚙️ API Reference

### `<LiquidGlassButton />` Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'default' \| 'primary' \| 'danger' \| 'accent' \| 'ghost'` | `'default'` | Visual glass style tint |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Sizing preset (32px, 44px, 52px min-height) |
| `radius` | `number \| 'pill'` | `'pill'` | Corner radius in pixels, or `'pill'` (999px) |
| `tint` | `string` | `undefined` | Custom CSS background color / tint |
| `optics` | `GlassOpticsConfig` | `undefined` | Real-time physical optics overrides (IOR, specular, lip glow, Fresnel) |
| `leadingIcon` | `ReactNode` | `undefined` | Icon or element rendered before button label |
| `trailingIcon` | `ReactNode` | `undefined` | Icon or element rendered after button label |
| `loading` | `boolean` | `false` | Displays an accessible glass spinner |
| `disabled` | `boolean` | `false` | Disables interaction and relaxes glass effect |
| `children` | `ReactNode` | `undefined` | Native text or content (stays crisp, unrasterized) |

### `GlassOpticsConfig` (Physical Shader Parameters)

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ior` | `number` | `1.518` | Snell's Law refractive index (Crown glass: 1.518, Diamond: 2.417, Water: 1.333) |
| `specularPower` | `number` | `14.0` | Exponent for the interactive cursor-tracking specular highlight |
| `lipGlow` | `number` | `1.0` | Multiplier for Apple's signature convex perimeter rim lip glow |
| `fresnelStrength` | `number` | `0.48` | Intensity of Schlick's Fresnel grazing-angle reflectivity |
| `bevelIntensity` | `number` | `1.0` | Shadow depth factor along the 3D dome curvature |

### `LiquidGlassController` Options

```typescript
interface LiquidGlassControllerOptions {
  /** Target CSS selector for glass candidates (default: 'button.liquid-glass-btn, [data-liquid-glass]') */
  selector?: string
  /** CSS selector for elements to exclude from glass rendering */
  excludeSelector?: string
  /** Container root element to observe (default: document.body) */
  root?: HTMLElement | Document
  /** Callback fired when WebGL2 context is lost */
  onContextLost?: () => void
}
```

---

## 🎨 CSS Custom Properties

You can customize the styling via CSS variables:

```css
:root {
  --liquid-glass-radius: 999px;
  --liquid-glass-ink: #18343e;
  --liquid-glass-base: rgba(255, 255, 255, 0.85);
  --liquid-glass-accent: #0071e3;
  --liquid-glass-focus-ring: rgba(0, 113, 227, 0.45);
}

[data-theme='dark'] {
  --liquid-glass-ink: #f0f7fa;
  --liquid-glass-base: rgba(28, 28, 30, 0.85);
  --liquid-glass-accent: #2997ff;
}
```

---

## 📊 Benchmark & Performance

Tested across Chrome 130, Edge 130, Firefox 132, and Safari 18:

| Metric | Measured Value | Standard Target | Status |
| :--- | :--- | :--- | :--- |
| **GPU Context Usage** | **1 shared context** | $\le 8$ contexts | Pass (Optimal) |
| **Idle GPU Usage** | **0.0% / 0 FPS** | 0% idle drain | Pass |
| **Render Latency** | **< 0.6ms** per tile | < 16.6ms (60 FPS) | Pass |
| **WCAG 2.1 Contrast** | **$\ge 4.5:1$** (AA) | 4.5:1 minimum | Pass (100% verified) |
| **Context Loss Recovery** | **Automatic fallback** | Graceful degradation | Pass |

---

## 👤 Author & Ownership

- **Author & Creator**: **Dương Thành Thanh Duy**
- **GitHub**: [@thanhduykx](https://github.com/thanhduykx)
- **Email**: `60205284+thanhduykx@users.noreply.github.com`
- **Design Heritage & Re-engineering**: Re-developed and adapted based on **Apple Inc.**'s Liquid Glass UI specification, Apple Human Interface Guidelines (Materials), and VisionOS/iOS optical material design language.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) © 2026 **Dương Thành Thanh Duy**.
Apple, iOS, and visionOS are trademarks of Apple Inc., registered in the U.S. and other countries.
