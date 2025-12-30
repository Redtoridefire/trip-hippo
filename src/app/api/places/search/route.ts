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

interface AutocompleteSuggestion {
  placeId: string
  name: string
  address: string
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

    // Try new API first, fall back to legacy
    let places: PlaceResult[] = []

    try {
      places = await searchWithNewAPI(query, lat, lng, GOOGLE_PLACES_API_KEY)
    } catch (newApiError) {
      console.log("New Places API search failed, trying legacy:", newApiError)
      try {
        places = await searchWithLegacyAPI(query, lat, lng, GOOGLE_PLACES_API_KEY)
      } catch (legacyError) {
        console.error("Legacy Places API search also failed:", legacyError)
        return NextResponse.json(
          { error: "Failed to search places" },
          { status: 500 }
        )
      }
    }

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

    // Try new API first, fall back to legacy
    let suggestions: AutocompleteSuggestion[] = []

    try {
      suggestions = await autocompleteWithNewAPI(input, sessionToken, GOOGLE_PLACES_API_KEY)
    } catch (newApiError) {
      console.log("New Places API autocomplete failed, trying legacy:", newApiError)
      try {
        suggestions = await autocompleteWithLegacyAPI(input, GOOGLE_PLACES_API_KEY)
      } catch (legacyError) {
        console.error("Legacy Places API autocomplete also failed:", legacyError)
        return NextResponse.json(
          { error: "Failed to get autocomplete suggestions" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Autocomplete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// New Places API - Text Search
async function searchWithNewAPI(
  query: string,
  lat: string | null,
  lng: string | null,
  apiKey: string
): Promise<PlaceResult[]> {
  const url = new URL("https://places.googleapis.com/v1/places:searchText")

  const body: Record<string, unknown> = {
    textQuery: query,
    maxResultCount: 10,
  }

  if (lat && lng) {
    body.locationBias = {
      circle: {
        center: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
        },
        radius: 50000,
      },
    }
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error("New Places API search error:", error)
    throw new Error("New Places API search failed")
  }

  const data = await response.json()

  return (data.places || []).map((place: {
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
}

// Legacy Places API - Text Search
async function searchWithLegacyAPI(
  query: string,
  lat: string | null,
  lng: string | null,
  apiKey: string
): Promise<PlaceResult[]> {
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`

  if (lat && lng) {
    url += `&location=${lat},${lng}&radius=50000`
  }

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error("Legacy Places API search request failed")
  }

  const data = await response.json()

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("Legacy Places API search status:", data.status, data.error_message)
    throw new Error(`Legacy Places API error: ${data.status}`)
  }

  return (data.results || []).map((place: {
    place_id: string
    name: string
    formatted_address?: string
    geometry?: { location: { lat: number; lng: number } }
    types?: string[]
    rating?: number
  }) => ({
    id: place.place_id,
    name: place.name,
    address: place.formatted_address || "",
    lat: place.geometry?.location?.lat,
    lng: place.geometry?.location?.lng,
    types: place.types,
    rating: place.rating,
  }))
}

// New Places API - Autocomplete
async function autocompleteWithNewAPI(
  input: string,
  sessionToken: string | undefined,
  apiKey: string
): Promise<AutocompleteSuggestion[]> {
  const url = new URL("https://places.googleapis.com/v1/places:autocomplete")

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      input,
      sessionToken,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error("New Places API autocomplete error:", error)
    throw new Error("New Places API autocomplete failed")
  }

  const data = await response.json()

  return (data.suggestions || []).map((suggestion: {
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
}

// Legacy Places API - Autocomplete
async function autocompleteWithLegacyAPI(
  input: string,
  apiKey: string
): Promise<AutocompleteSuggestion[]> {
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error("Legacy Places API autocomplete request failed")
  }

  const data = await response.json()

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("Legacy Places API autocomplete status:", data.status, data.error_message)
    throw new Error(`Legacy Places API error: ${data.status}`)
  }

  return (data.predictions || []).map((prediction: {
    place_id: string
    structured_formatting?: {
      main_text: string
      secondary_text?: string
    }
    description?: string
  }) => ({
    placeId: prediction.place_id,
    name: prediction.structured_formatting?.main_text || prediction.description || "",
    address: prediction.structured_formatting?.secondary_text || "",
  }))
}
