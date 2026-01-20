import { BladePoint } from '@/state/useYachtStore'

/**
 * Catmull-Rom spline interpolation for smooth blade curves
 * Creates smooth curves through control points
 */

// Catmull-Rom spline interpolation
export function catmullRomSpline(
  p0: BladePoint,
  p1: BladePoint,
  p2: BladePoint,
  p3: BladePoint,
  t: number
): BladePoint {
  const t2 = t * t
  const t3 = t2 * t

  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3)

  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)

  return { x, y }
}

// Interpolate points along a Catmull-Rom spline
export function interpolateSpline(
  points: BladePoint[],
  segmentsPerCurve: number = 10
): BladePoint[] {
  if (points.length < 2) return points
  if (points.length === 2) {
    // Linear interpolation for 2 points
    const result: BladePoint[] = []
    for (let i = 0; i <= segmentsPerCurve; i++) {
      const t = i / segmentsPerCurve
      result.push({
        x: points[0].x + (points[1].x - points[0].x) * t,
        y: points[0].y + (points[1].y - points[0].y) * t,
      })
    }
    return result
  }

  const result: BladePoint[] = []

  // Pad the points array for Catmull-Rom (need 4 points for each segment)
  const paddedPoints = [
    points[0], // Duplicate first point
    ...points,
    points[points.length - 1], // Duplicate last point
  ]

  // Generate interpolated points
  for (let i = 0; i < paddedPoints.length - 3; i++) {
    const p0 = paddedPoints[i]
    const p1 = paddedPoints[i + 1]
    const p2 = paddedPoints[i + 2]
    const p3 = paddedPoints[i + 3]

    for (let j = 0; j < segmentsPerCurve; j++) {
      const t = j / segmentsPerCurve
      result.push(catmullRomSpline(p0, p1, p2, p3, t))
    }
  }

  // Add the last point
  result.push(points[points.length - 1])

  return result
}

// Simplify a path using Douglas-Peucker algorithm
export function simplifyPath(
  points: BladePoint[],
  tolerance: number = 2
): BladePoint[] {
  if (points.length <= 2) return points

  // Find the point with maximum distance from line between first and last
  let maxDist = 0
  let maxIndex = 0

  const first = points[0]
  const last = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last)
    if (dist > maxDist) {
      maxDist = dist
      maxIndex = i
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance)
    const right = simplifyPath(points.slice(maxIndex), tolerance)
    return [...left.slice(0, -1), ...right]
  }

  // Otherwise, just return endpoints
  return [first, last]
}

// Calculate perpendicular distance from point to line
function perpendicularDistance(
  point: BladePoint,
  lineStart: BladePoint,
  lineEnd: BladePoint
): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y

  if (dx === 0 && dy === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
    )
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
        (dx * dx + dy * dy)
    )
  )

  const projX = lineStart.x + t * dx
  const projY = lineStart.y + t * dy

  return Math.sqrt(Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2))
}

// Calculate distance between two points
export function distance(p1: BladePoint, p2: BladePoint): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

// Rotate a point around origin by angle (radians)
export function rotatePoint(
  point: BladePoint,
  angle: number,
  center: BladePoint = { x: 0, y: 0 }
): BladePoint {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = point.x - center.x
  const dy = point.y - center.y

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

// Apply kaleidoscope symmetry to points
export function applyKaleidoscope(
  points: BladePoint[],
  bladeCount: number,
  center: BladePoint = { x: 0, y: 0 }
): BladePoint[][] {
  const result: BladePoint[][] = []
  const angleStep = (2 * Math.PI) / bladeCount

  for (let i = 0; i < bladeCount; i++) {
    const angle = angleStep * i
    const rotatedPoints = points.map((p) => rotatePoint(p, angle, center))
    result.push(rotatedPoints)
  }

  return result
}

// Normalize points to fit within a unit circle (0-1 range from center)
export function normalizePoints(
  points: BladePoint[],
  canvasSize: number
): BladePoint[] {
  const center = canvasSize / 2
  return points.map((p) => ({
    x: (p.x - center) / center,
    y: (p.y - center) / center,
  }))
}

// Denormalize points from unit circle back to canvas coordinates
export function denormalizePoints(
  points: BladePoint[],
  canvasSize: number
): BladePoint[] {
  const center = canvasSize / 2
  return points.map((p) => ({
    x: p.x * center + center,
    y: p.y * center + center,
  }))
}
