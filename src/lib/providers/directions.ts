/**
 * Directions Provider Interface
 *
 * Abstracts directions/routing across multiple providers
 * (Mapbox, Google Directions, OSRM, etc.)
 */

import type { DirectionsResult } from "@/types"

export interface DirectionsOptions {
  origin: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  waypoints?: { lat: number; lng: number }[]
  mode?: "driving" | "walking" | "cycling"
}

export interface MatrixResult {
  distances: number[][] // meters
  durations: number[][] // seconds
}

export interface DirectionsProvider {
  name: string
  getDirections(options: DirectionsOptions): Promise<DirectionsResult | null>
  getMatrix(
    origins: { lat: number; lng: number }[],
    destinations: { lat: number; lng: number }[]
  ): Promise<MatrixResult | null>
}

// Mapbox Directions Provider
export class MapboxDirectionsProvider implements DirectionsProvider {
  name = "mapbox"
  private token: string

  constructor(token: string) {
    this.token = token
  }

  async getDirections(options: DirectionsOptions): Promise<DirectionsResult | null> {
    const { origin, destination, waypoints = [], mode = "driving" } = options

    // Build coordinates string
    const coords = [
      `${origin.lng},${origin.lat}`,
      ...waypoints.map(wp => `${wp.lng},${wp.lat}`),
      `${destination.lng},${destination.lat}`,
    ].join(";")

    const profile = mode === "walking" ? "walking" : mode === "cycling" ? "cycling" : "driving"
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}?access_token=${this.token}&geometries=polyline&overview=full`

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Mapbox directions failed")

      const data = await response.json()
      const route = data.routes?.[0]
      if (!route) return null

      return {
        distance_meters: Math.round(route.distance),
        duration_seconds: Math.round(route.duration),
        polyline: route.geometry,
        steps: route.legs?.flatMap((leg: any) =>
          leg.steps?.map((step: any) => ({
            instruction: step.maneuver?.instruction || "",
            distance_meters: Math.round(step.distance),
            duration_seconds: Math.round(step.duration),
          })) || []
        ),
      }
    } catch (error) {
      console.error("Mapbox directions error:", error)
      return null
    }
  }

  async getMatrix(
    origins: { lat: number; lng: number }[],
    destinations: { lat: number; lng: number }[]
  ): Promise<MatrixResult | null> {
    // Mapbox Matrix API
    // Note: Has limits on number of coordinates
    const allCoords = [...origins, ...destinations]
    if (allCoords.length > 25) {
      console.warn("Mapbox Matrix API limited to 25 coordinates")
      return null
    }

    const coords = allCoords.map(c => `${c.lng},${c.lat}`).join(";")
    const sources = origins.map((_, i) => i).join(";")
    const destIndices = destinations.map((_, i) => origins.length + i).join(";")

    const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coords}?access_token=${this.token}&sources=${sources}&destinations=${destIndices}`

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Mapbox matrix failed")

      const data = await response.json()

      return {
        distances: data.distances || [],
        durations: data.durations || [],
      }
    } catch (error) {
      console.error("Mapbox matrix error:", error)
      return null
    }
  }
}

// Google Distance Matrix Provider
export class GoogleDistanceMatrixProvider implements DirectionsProvider {
  name = "google"
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getDirections(options: DirectionsOptions): Promise<DirectionsResult | null> {
    // Google Directions API - for now return null, use Matrix for optimization
    return null
  }

  async getMatrix(
    origins: { lat: number; lng: number }[],
    destinations: { lat: number; lng: number }[]
  ): Promise<MatrixResult | null> {
    const originsStr = origins.map(o => `${o.lat},${o.lng}`).join("|")
    const destsStr = destinations.map(d => `${d.lat},${d.lng}`).join("|")

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originsStr)}&destinations=${encodeURIComponent(destsStr)}&key=${this.apiKey}`

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Google Distance Matrix failed")

      const data = await response.json()

      if (data.status !== "OK") {
        console.error("Google Distance Matrix error:", data.status)
        return null
      }

      const distances: number[][] = []
      const durations: number[][] = []

      for (const row of data.rows) {
        const distRow: number[] = []
        const durRow: number[] = []
        for (const element of row.elements) {
          if (element.status === "OK") {
            distRow.push(element.distance.value)
            durRow.push(element.duration.value)
          } else {
            distRow.push(Infinity)
            durRow.push(Infinity)
          }
        }
        distances.push(distRow)
        durations.push(durRow)
      }

      return { distances, durations }
    } catch (error) {
      console.error("Google Distance Matrix error:", error)
      return null
    }
  }
}

// Factory to get the configured provider
export function getDirectionsProvider(): DirectionsProvider {
  const googleKey = process.env.GOOGLE_DIRECTIONS_API_KEY
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  // Prefer Google if available (better for driving directions)
  if (googleKey) {
    return new GoogleDistanceMatrixProvider(googleKey)
  }

  if (mapboxToken) {
    return new MapboxDirectionsProvider(mapboxToken)
  }

  throw new Error("No directions provider configured")
}

// TSP optimization using nearest neighbor + 2-opt
export async function optimizeRoute(
  places: { id: string; lat: number; lng: number }[],
  startId?: string,
  endId?: string
): Promise<{ order: string[]; distance: number; duration: number } | null> {
  if (places.length < 2) {
    return { order: places.map(p => p.id), distance: 0, duration: 0 }
  }

  const provider = getDirectionsProvider()
  const matrix = await provider.getMatrix(places, places)

  if (!matrix) return null

  // Nearest neighbor algorithm
  const n = places.length
  const visited = new Set<number>()
  const order: number[] = []

  // Start from specified place or first place
  let current = startId
    ? places.findIndex(p => p.id === startId)
    : 0

  order.push(current)
  visited.add(current)

  // Find end index if specified
  const endIndex = endId ? places.findIndex(p => p.id === endId) : -1

  while (order.length < n) {
    let nearest = -1
    let nearestDist = Infinity

    for (let i = 0; i < n; i++) {
      if (visited.has(i)) continue
      // If we have an end point, don't visit it until last
      if (i === endIndex && order.length < n - 1) continue

      const dist = matrix.distances[current][i]
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = i
      }
    }

    if (nearest === -1) {
      // Only end point remains
      if (endIndex !== -1 && !visited.has(endIndex)) {
        nearest = endIndex
      } else {
        break
      }
    }

    order.push(nearest)
    visited.add(nearest)
    current = nearest
  }

  // 2-opt improvement
  let improved = true
  while (improved) {
    improved = false
    for (let i = 1; i < order.length - 2; i++) {
      for (let j = i + 1; j < order.length - 1; j++) {
        const d1 = matrix.distances[order[i - 1]][order[i]] +
                   matrix.distances[order[j]][order[j + 1]]
        const d2 = matrix.distances[order[i - 1]][order[j]] +
                   matrix.distances[order[i]][order[j + 1]]

        if (d2 < d1) {
          // Reverse segment
          const segment = order.slice(i, j + 1).reverse()
          order.splice(i, j - i + 1, ...segment)
          improved = true
        }
      }
    }
  }

  // Calculate total distance and duration
  let totalDistance = 0
  let totalDuration = 0
  for (let i = 0; i < order.length - 1; i++) {
    totalDistance += matrix.distances[order[i]][order[i + 1]]
    totalDuration += matrix.durations[order[i]][order[i + 1]]
  }

  return {
    order: order.map(i => places[i].id),
    distance: Math.round(totalDistance),
    duration: Math.round(totalDuration),
  }
}
