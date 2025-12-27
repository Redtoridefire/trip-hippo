import { createClient } from "@/lib/supabase/server"
import { MapView } from "@/components/trip/map/map-view"
import type { ItineraryItem, TripDay } from "@/types"

async function getMapData(tripId: string) {
  const supabase = await createClient()

  // Get days
  const { data: days } = await supabase
    .from("trip_days")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_date", { ascending: true })

  // Get itinerary items with places that have coordinates
  const { data: items } = await supabase
    .from("itinerary_items")
    .select(`
      *,
      place:places(*)
    `)
    .eq("trip_id", tripId)
    .is("deleted_at", null)
    .not("place_id", "is", null)

  // Filter to only items with lat/lng
  const itemsWithCoords = (items || []).filter(
    (item: any) => item.place?.lat && item.place?.lng
  )

  return {
    days: (days || []) as TripDay[],
    items: itemsWithCoords as ItineraryItem[],
  }
}

export default async function MapPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const { days, items } = await getMapData(tripId)

  return <MapView tripId={tripId} days={days} items={items} />
}
