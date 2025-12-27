import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { optimizeRoute } from "@/lib/providers/directions"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tripId, dayId, places } = body

    if (!places || !Array.isArray(places) || places.length < 2) {
      return NextResponse.json(
        { error: "At least 2 places with coordinates are required" },
        { status: 400 }
      )
    }

    // Filter places that have coordinates
    const validPlaces = places.filter(
      (p: { id: string; lat?: number; lng?: number }) =>
        p.lat != null && p.lng != null
    )

    if (validPlaces.length < 2) {
      return NextResponse.json(
        { error: "At least 2 places with coordinates are required" },
        { status: 400 }
      )
    }

    // Optimize the route
    const result = await optimizeRoute(validPlaces)

    if (!result) {
      return NextResponse.json(
        { error: "Failed to optimize route. Please try again." },
        { status: 500 }
      )
    }

    // Update sort orders in the database if dayId is provided
    if (dayId && tripId) {
      const updates = result.order.map((itemId, index) => ({
        id: itemId,
        sort_order: index,
      }))

      for (const update of updates) {
        await supabase
          .from("itinerary_items")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id)
      }

      // Store the route run
      await supabase.from("route_runs").insert({
        trip_id: tripId,
        day_id: dayId,
        optimized_order: result.order,
        distance_meters: result.distance,
        duration_seconds: result.duration,
        provider: "google",
        created_by: user.id,
      })
    }

    return NextResponse.json({
      order: result.order,
      distance: result.distance,
      duration: result.duration,
      distanceText: formatDistance(result.distance),
      durationText: formatDuration(result.duration),
    })
  } catch (error) {
    console.error("Route optimization error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`
  }
  const km = meters / 1000
  return `${km.toFixed(1)} km`
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes} min`
}
