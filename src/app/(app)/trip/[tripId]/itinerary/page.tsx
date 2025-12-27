import { createClient } from "@/lib/supabase/server"
import { ItineraryView } from "@/components/trip/itinerary/itinerary-view"
import type { TripDay, ItineraryItem } from "@/types"

async function getTripData(tripId: string) {
  const supabase = await createClient()

  // Get days
  const { data: days } = await supabase
    .from("trip_days")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_date", { ascending: true })

  // Get itinerary items with places
  const { data: items } = await supabase
    .from("itinerary_items")
    .select(`
      *,
      place:places(*)
    `)
    .eq("trip_id", tripId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })

  // Get lists
  const { data: lists } = await supabase
    .from("trip_lists")
    .select("*")
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true })

  return {
    days: (days || []) as TripDay[],
    items: (items || []) as ItineraryItem[],
    lists: lists || [],
  }
}

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const { days, items, lists } = await getTripData(tripId)

  return (
    <ItineraryView
      tripId={tripId}
      days={days}
      items={items}
      lists={lists}
    />
  )
}
