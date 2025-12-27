import { NextRequest, NextResponse } from "next/server"

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

interface PlaceResult {
  id: string
  name: string
  address: string
  lat?: number
  lng?: number
  types?: string[]
  rating?: number
}

export async function GET(request: NextRequest) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "Google Places API key not configured" },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      )
    }

    // Use Text Search API (New)
    const url = new URL("https://places.googleapis.com/v1/places:searchText")

    const body: Record<string, unknown> = {
      textQuery: query,
      maxResultCount: 10,
    }

    // Add location bias if coordinates provided
    if (lat && lng) {
      body.locationBias = {
        circle: {
          center: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
          },
          radius: 50000, // 50km radius
        },
      }
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Google Places API error:", error)
      return NextResponse.json(
        { error: "Failed to search places" },
        { status: 500 }
      )
    }

    const data = await response.json()

    const places: PlaceResult[] = (data.places || []).map((place: {
      id: string
      displayName?: { text: string }
      formattedAddress?: string
      location?: { latitude: number; longitude: number }
      types?: string[]
      rating?: number
    }) => ({
      id: place.id,
      name: place.displayName?.text || "",
      address: place.formattedAddress || "",
      lat: place.location?.latitude,
      lng: place.location?.longitude,
      types: place.types,
      rating: place.rating,
    }))

    return NextResponse.json({ places })
  } catch (error) {
    console.error("Places search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Autocomplete endpoint
export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "Google Places API key not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { input, sessionToken } = body

    if (!input) {
      return NextResponse.json(
        { error: "Input is required" },
        { status: 400 }
      )
    }

    const url = new URL("https://places.googleapis.com/v1/places:autocomplete")

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      },
      body: JSON.stringify({
        input,
        sessionToken,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Google Places Autocomplete error:", error)
      return NextResponse.json(
        { error: "Failed to get autocomplete suggestions" },
        { status: 500 }
      )
    }

    const data = await response.json()

    const suggestions = (data.suggestions || []).map((suggestion: {
      placePrediction?: {
        placeId: string
        text?: { text: string }
        structuredFormat?: {
          mainText?: { text: string }
          secondaryText?: { text: string }
        }
      }
    }) => ({
      placeId: suggestion.placePrediction?.placeId,
      name: suggestion.placePrediction?.structuredFormat?.mainText?.text ||
            suggestion.placePrediction?.text?.text || "",
      address: suggestion.placePrediction?.structuredFormat?.secondaryText?.text || "",
    }))

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Autocomplete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
