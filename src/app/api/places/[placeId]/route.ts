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

    // Validate placeId format (Google place IDs are alphanumeric with possible dashes and underscores)
    // Max length of 500 chars to prevent potential abuse
    if (!/^[a-zA-Z0-9_-]{1,500}$/.test(placeId)) {
      return NextResponse.json(
        { error: "Invalid place ID format" },
        { status: 400 }
      )
    }

    // Use Places API (New) - Get Place Details
    const url = `https://places.googleapis.com/v1/places/${placeId}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
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
      console.error("Google Places API error:", error)
      return NextResponse.json(
        { error: "Failed to get place details" },
        { status: 500 }
      )
    }

    const data = await response.json()

    // Map price level enum to number (1-4)
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
          // Construct photo URL using the Photos API
          const photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=800&maxWidthPx=800&key=${GOOGLE_PLACES_API_KEY}`
          photoUrls.push(photoUrl)
        }
      }
    }

    const place: PlaceDetails = {
      id: data.id,
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

    return NextResponse.json({ place })
  } catch (error) {
    console.error("Place details error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
