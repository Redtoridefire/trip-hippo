/**
 * Places Provider Interface
 *
 * Abstracts place search and details across multiple providers
 * (Mapbox, Google Places, Foursquare, etc.)
 */

import type { PlaceSearchResult, Place } from "@/types"

export interface PlaceDetails {
  provider: string
  provider_place_id: string
  name: string
  address?: string
  lat?: number
  lng?: number
  phone?: string
  website?: string
  rating?: number
  price_level?: number
  opening_hours?: Record<string, string>
  photos?: string[]
  categories?: string[]
  raw?: Record<string, unknown>
}

export interface PlaceSearchOptions {
  query: string
  near?: { lat: number; lng: number }
  limit?: number
  types?: string[]
}

export interface PlacesProvider {
  name: string
  search(options: PlaceSearchOptions): Promise<PlaceSearchResult[]>
  getDetails(providerPlaceId: string): Promise<PlaceDetails | null>
}

// Mapbox Search Provider
export class MapboxPlacesProvider implements PlacesProvider {
  name = "mapbox"
  private token: string

  constructor(token: string) {
    this.token = token
  }

  async search(options: PlaceSearchOptions): Promise<PlaceSearchResult[]> {
    const { query, near, limit = 10 } = options

    let url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${this.token}&limit=${limit}&language=en`

    if (near) {
      url += `&proximity=${near.lng},${near.lat}`
    }

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Mapbox search failed")

      const data = await response.json()

      return (data.suggestions || []).map((item: any) => ({
        provider: "mapbox",
        provider_place_id: item.mapbox_id,
        name: item.name,
        address: item.full_address || item.place_formatted,
        lat: item.geometry?.coordinates?.[1],
        lng: item.geometry?.coordinates?.[0],
        categories: item.poi_category || [],
      }))
    } catch (error) {
      console.error("Mapbox search error:", error)
      return []
    }
  }

  async getDetails(providerPlaceId: string): Promise<PlaceDetails | null> {
    const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${providerPlaceId}?access_token=${this.token}`

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Mapbox retrieve failed")

      const data = await response.json()
      const feature = data.features?.[0]
      if (!feature) return null

      const props = feature.properties || {}

      return {
        provider: "mapbox",
        provider_place_id: providerPlaceId,
        name: props.name,
        address: props.full_address || props.address,
        lat: feature.geometry?.coordinates?.[1],
        lng: feature.geometry?.coordinates?.[0],
        phone: props.phone,
        website: props.website,
        categories: props.poi_category || [],
        opening_hours: props.operational_hours,
        raw: feature,
      }
    } catch (error) {
      console.error("Mapbox retrieve error:", error)
      return null
    }
  }
}

// Factory to get the configured provider
export function getPlacesProvider(): PlacesProvider {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (mapboxToken) {
    return new MapboxPlacesProvider(mapboxToken)
  }

  throw new Error("No places provider configured. Set NEXT_PUBLIC_MAPBOX_TOKEN or NEXT_PUBLIC_GOOGLE_MAPS_KEY")
}

// Utility to convert provider result to our Place type
export function toPlace(details: PlaceDetails): Omit<Place, "id" | "created_at"> {
  return {
    provider: details.provider,
    provider_place_id: details.provider_place_id,
    name: details.name,
    address: details.address,
    lat: details.lat,
    lng: details.lng,
    phone: details.phone,
    website: details.website,
    rating: details.rating,
    price_level: details.price_level,
    opening_hours: details.opening_hours
      ? Object.entries(details.opening_hours).map(([day, hours]) => `${day}: ${hours}`)
      : undefined,
    photos: details.photos,
    categories: details.categories,
  }
}
