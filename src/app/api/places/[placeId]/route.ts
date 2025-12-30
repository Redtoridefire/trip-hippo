import { NextRequest, NextResponse } from "next/server"

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

interface PlaceDetails {
  id: string
  name: string
  address?: string
  description?: string
  lat?: number
  lng?: number
  phone?: string
  website?: string
  rating?: number
  userRatingCount?: number
  priceLevel?: number
  openingHours?: string[]
  photos?: string[]
  types?: string[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      console.error("Google Places API key not configured")
      return NextResponse.json(
        { error: "Google Places API key not configured" },
        { status: 500 }
      )
    }

    const { placeId } = await params

    if (!placeId) {
      return NextResponse.json(
        { error: "Place ID is required" },
        { status: 400 }
      )
    }

    // Validate placeId - check for reasonable length and no obvious injection
    if (!placeId || placeId.length > 500 || /[<>"'`]/.test(placeId)) {
      return NextResponse.json(
        { error: "Invalid place ID format" },
        { status: 400 }
      )
    }

    // Try the new Places API first, fall back to legacy if it fails
    let place: PlaceDetails | null = null

    // First try: Places API (New)
    try {
      place = await fetchFromNewPlacesAPI(placeId, GOOGLE_PLACES_API_KEY)
    } catch (newApiError) {
      console.log("New Places API failed, trying legacy API:", newApiError)
    }

    // Fallback: Legacy Places API
    if (!place) {
      try {
        place = await fetchFromLegacyPlacesAPI(placeId, GOOGLE_PLACES_API_KEY)
      } catch (legacyError) {
        console.error("Legacy Places API also failed:", legacyError)
        return NextResponse.json(
          { error: "Failed to get place details from Google" },
          { status: 500 }
        )
      }
    }

    if (!place) {
      return NextResponse.json(
        { error: "Place not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ place })
  } catch (error) {
    console.error("Place details error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// New Places API (places.googleapis.com)
async function fetchFromNewPlacesAPI(placeId: string, apiKey: string): Promise<PlaceDetails | null> {
  const url = `https://places.googleapis.com/v1/places/${placeId}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "id",
        "displayName",
        "formattedAddress",
        "location",
        "types",
        "rating",
        "userRatingCount",
        "priceLevel",
        "regularOpeningHours",
        "nationalPhoneNumber",
        "internationalPhoneNumber",
        "websiteUri",
        "editorialSummary",
        "photos",
      ].join(","),
    },
  })

  if (!response.ok) {
    const error = await response.json()
    console.error("New Places API error:", error)
    throw new Error("New Places API failed")
  }

  const data = await response.json()

  // Map price level enum to number (0-4)
  const priceLevelMap: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  }

  // Get photo URLs (up to 5)
  const photoUrls: string[] = []
  if (data.photos && Array.isArray(data.photos)) {
    for (const photo of data.photos.slice(0, 5)) {
      if (photo.name) {
        const photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=800&maxWidthPx=800&key=${apiKey}`
        photoUrls.push(photoUrl)
      }
    }
  }

  return {
    id: data.id || placeId,
    name: data.displayName?.text || "",
    address: data.formattedAddress || "",
    description: data.editorialSummary?.text || "",
    lat: data.location?.latitude,
    lng: data.location?.longitude,
    phone: data.nationalPhoneNumber || data.internationalPhoneNumber || "",
    website: data.websiteUri || "",
    rating: data.rating,
    userRatingCount: data.userRatingCount,
    priceLevel: data.priceLevel ? priceLevelMap[data.priceLevel] : undefined,
    openingHours: data.regularOpeningHours?.weekdayDescriptions || [],
    photos: photoUrls,
    types: data.types || [],
  }
}

// Legacy Places API (maps.googleapis.com)
async function fetchFromLegacyPlacesAPI(placeId: string, apiKey: string): Promise<PlaceDetails | null> {
  const fields = [
    "place_id",
    "name",
    "formatted_address",
    "geometry",
    "types",
    "rating",
    "user_ratings_total",
    "price_level",
    "opening_hours",
    "formatted_phone_number",
    "international_phone_number",
    "website",
    "editorial_summary",
    "photos",
  ].join(",")

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error("Legacy Places API request failed")
  }

  const data = await response.json()

  if (data.status !== "OK") {
    console.error("Legacy Places API status:", data.status, data.error_message)
    throw new Error(`Legacy Places API error: ${data.status}`)
  }

  const result = data.result
  if (!result) {
    return null
  }

  // Get photo URLs (up to 5)
  const photoUrls: string[] = []
  if (result.photos && Array.isArray(result.photos)) {
    for (const photo of result.photos.slice(0, 5)) {
      if (photo.photo_reference) {
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`
        photoUrls.push(photoUrl)
      }
    }
  }

  return {
    id: result.place_id || placeId,
    name: result.name || "",
    address: result.formatted_address || "",
    description: result.editorial_summary?.overview || "",
    lat: result.geometry?.location?.lat,
    lng: result.geometry?.location?.lng,
    phone: result.formatted_phone_number || result.international_phone_number || "",
    website: result.website || "",
    rating: result.rating,
    userRatingCount: result.user_ratings_total,
    priceLevel: result.price_level,
    openingHours: result.opening_hours?.weekday_text || [],
    photos: photoUrls,
    types: result.types || [],
  }
}
