import { useEffect, useRef } from 'react'

/**
 * A slowly rotating Earth rendered as a field of small squares.
 *
 * Continents are coarse lat/lng polygons; points are laid out with a Fibonacci
 * lattice (even spacing on a sphere, no clumping at the poles) and kept only
 * where they fall on land. Every frame rotates them around the polar axis and
 * projects orthographically — the near hemisphere is drawn, the far one isn't.
 *
 * Canvas rather than SVG or DOM: ~1,400 points at 60fps is trivial for canvas
 * and would be thousands of nodes to lay out otherwise.
 */

/** Rough continent outlines, [lng, lat]. Precision doesn't matter at this dot size. */
const LAND = [
  // North America
  [[-168, 65], [-160, 71], [-140, 70], [-125, 60], [-123, 49], [-117, 32], [-105, 23],
   [-97, 16], [-83, 9], [-80, 25], [-75, 35], [-70, 44], [-60, 47], [-55, 52], [-64, 60],
   [-78, 62], [-95, 68], [-125, 70]],
  // Greenland
  [[-45, 60], [-20, 70], [-20, 82], [-60, 82], [-58, 70]],
  // South America
  [[-81, 8], [-75, 11], [-60, 10], [-50, 0], [-35, -5], [-35, -22], [-48, -25], [-58, -35],
   [-62, -42], [-65, -55], [-75, -50], [-73, -40], [-71, -20], [-81, -5]],
  // Africa
  [[-17, 15], [-10, 28], [10, 37], [25, 32], [35, 30], [43, 12], [51, 12], [42, -2],
   [40, -15], [35, -22], [20, -35], [18, -33], [12, -18], [9, 4], [-8, 5]],
  // Europe
  [[-10, 36], [-9, 43], [-2, 48], [2, 51], [5, 58], [10, 58], [20, 55], [30, 60], [40, 62],
   [40, 45], [28, 41], [20, 40], [15, 38], [5, 40], [-6, 36]],
  // Asia
  [[30, 40], [35, 45], [45, 55], [60, 60], [80, 70], [100, 72], [130, 70], [140, 60],
   [135, 50], [130, 42], [122, 32], [120, 22], [105, 10], [95, 5], [80, 8], [72, 20],
   [60, 25], [50, 28], [45, 35]],
  // Australia
  [[113, -22], [115, -33], [130, -32], [140, -38], [150, -37], [153, -28], [145, -15],
   [135, -12], [125, -14]],
  // Japan / Indonesia / Britain — small but recognisable, so worth including
  [[130, 31], [141, 36], [145, 44], [140, 41], [133, 34]],
  [[95, 5], [120, 0], [130, -3], [120, -8], [100, -3]],
  [[-6, 50], [-2, 53], [-3, 58], [-6, 57], [-8, 53]],
]

function inPolygon(lng, lat, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

const onLand = (lng, lat) => LAND.some((p) => inPolygon(lng, lat, p))

/** Even distribution over a sphere. Grid-based lattices clump badly at the poles. */
function buildPoints(count) {
  const pts = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    const x = Math.cos(theta) * r
    const z = Math.sin(theta) * r

    const lat = Math.asin(y) * (180 / Math.PI)
    const lng = Math.atan2(z, x) * (180 / Math.PI)

    if (onLand(lng, lat)) {
      // A few points pulse, like nodes reporting in. Sparse on purpose.
      pts.push({ x, y, z, pulse: Math.random() < 0.04 ? Math.random() * Math.PI * 2 : null })
    }
  }
  return pts
}

export default function PixelGlobe({ size = 620, speed = 0.055 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const points = buildPoints(9000)
    const cx = size / 2
    const cy = size / 2
    const radius = size * 0.42

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf
    let angle = 0
    let last = performance.now()

    const draw = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (!reduced) angle += dt * speed

      ctx.clearRect(0, 0, size, size)
      const sin = Math.sin(angle)
      const cos = Math.cos(angle)
      const t = now / 1000

      for (const p of points) {
        // Rotate about the polar axis.
        const x = p.x * cos - p.z * sin
        const z = p.x * sin + p.z * cos
        if (z < 0) continue // far hemisphere — skip entirely

        const sx = cx + x * radius
        const sy = cy - p.y * radius

        // Depth: points near the limb are dimmer and smaller, which is what
        // makes a flat projection read as a sphere.
        const depth = z
        let alpha = 0.12 + depth * 0.62
        let dot = 1.15 + depth * 1.15

        if (p.pulse !== null) {
          const beat = (Math.sin(t * 1.6 + p.pulse) + 1) / 2
          alpha = Math.min(1, alpha + beat * 0.5)
          dot += beat * 0.9
          ctx.fillStyle = `rgba(52, 211, 153, ${alpha})`
        } else {
          ctx.fillStyle = `rgba(226, 240, 234, ${alpha * 0.9})`
        }

        ctx.fillRect(sx - dot / 2, sy - dot / 2, dot, dot)
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [size, speed])

  return (
    <div className="globe-wrap" aria-hidden="true">
      <div className="globe-glow" />
      <canvas ref={canvasRef} className="globe-canvas"
        style={{ width: size, height: size }} />
    </div>
  )
}