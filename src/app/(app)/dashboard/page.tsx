import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import type { Trip, Reservation } from "@/types"

interface DashboardData {
  upcomingTrip: Trip | null
  ongoingTrip: Trip | null
  upcomingReservations: Reservation[]
  recentTrips: Trip[]
  stats: {
    totalTrips: number
    upcomingTrips: number
    totalDestinations: number
    daysUntilNextTrip: number | null
  }
}

async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      upcomingTrip: null,
      ongoingTrip: null,
      upcomingReservations: [],
      recentTrips: [],
      stats: { totalTrips: 0, upcomingTrips: 0, totalDestinations: 0, daysUntilNextTrip: null },
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString().split("T")[0]

  // Get all user's trips
  const { data: ownedTrips } = await supabase
    .from("trips")
    .select("*")
    .eq("owner_id", user.id)
    .is("deleted_at", null)

  const { data: memberData } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", user.id)

  let memberTrips: Trip[] = []
  if (memberData && memberData.length > 0) {
    const tripIds = memberData.map((m: { trip_id: string }) => m.trip_id)
    const { data } = await supabase
      .from("trips")
      .select("*")
      .in("id", tripIds)
      .is("deleted_at", null)
    memberTrips = (data || []) as Trip[]
  }

  const allTrips = [...(ownedTrips || []), ...memberTrips].filter(
    (trip, index, self) => index === self.findIndex(t => t.id === trip.id)
  ) as Trip[]

  // Find ongoing trip
  const ongoingTrip = allTrips.find((trip) => {
    if (!trip.start_date || !trip.end_date) return false
    return trip.start_date <= todayISO && trip.end_date >= todayISO
  }) || null

  // Find next upcoming trip
  const upcomingTrips = allTrips
    .filter((trip) => trip.start_date && trip.start_date > todayISO)
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())

  const upcomingTrip = upcomingTrips[0] || null

  // Get reservations for upcoming trips
  const upcomingTripIds = upcomingTrips.slice(0, 3).map(t => t.id)
  let upcomingReservations: Reservation[] = []

  if (upcomingTripIds.length > 0) {
    const { data: reservations } = await supabase
      .from("reservations")
      .select("*")
      .in("trip_id", upcomingTripIds)
      .gte("start_dt", new Date().toISOString())
      .is("deleted_at", null)
      .order("start_dt", { ascending: true })
      .limit(5)

    upcomingReservations = (reservations || []) as Reservation[]
  }

  // Get recent/past trips
  const recentTrips = allTrips
    .filter((trip) => trip.end_date && trip.end_date < todayISO)
    .sort((a, b) => new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime())
    .slice(0, 3) as Trip[]

  // Calculate stats
  const destinations = new Set(allTrips.map(t => t.home_base).filter(Boolean))
  let daysUntilNextTrip: number | null = null

  if (upcomingTrip?.start_date) {
    const nextDate = new Date(upcomingTrip.start_date)
    const diff = nextDate.getTime() - today.getTime()
    daysUntilNextTrip = Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return {
    upcomingTrip,
    ongoingTrip,
    upcomingReservations,
    recentTrips,
    stats: {
      totalTrips: allTrips.length,
      upcomingTrips: upcomingTrips.length,
      totalDestinations: destinations.size,
      daysUntilNextTrip,
    },
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return <DashboardClient data={data} />
}
