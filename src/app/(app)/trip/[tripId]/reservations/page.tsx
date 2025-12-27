import { createClient } from "@/lib/supabase/server"
import { ReservationsView } from "@/components/trip/reservations/reservations-view"
import type { Reservation } from "@/types"

async function getReservations(tripId: string) {
  const supabase = await createClient()

  const { data: reservations } = await supabase
    .from("reservations")
    .select(`
      *,
      attachments(*)
    `)
    .eq("trip_id", tripId)
    .is("deleted_at", null)
    .order("start_dt", { ascending: true })

  return (reservations || []) as Reservation[]
}

export default async function ReservationsPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const reservations = await getReservations(tripId)

  return <ReservationsView tripId={tripId} reservations={reservations} />
}
