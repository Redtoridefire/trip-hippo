import { createClient } from "@/lib/supabase/server"
import { CreateTripButton } from "@/components/trips/create-trip-button"
import { Plus, Map, Calendar, Clock, MapPin, Plane, Search, Filter } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateRange } from "@/lib/utils"

interface Trip {
  id: string
  name: string
  home_base: string | null
  start_date: string | null
  end_date: string | null
  cover_image: string | null
  updated_at: string
}

async function getTrips() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Get trips where user is owner
  const { data: ownedTrips, error: ownedError } = await supabase
    .from("trips")
    .select("*")
    .eq("owner_id", user.id)
    .is("deleted_at", null)

  if (ownedError) {
    console.error("Error fetching owned trips:", ownedError)
  }

  // Get trips where user is a member
  const { data: memberData, error: memberError } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", user.id)

  let memberTrips: Trip[] = []
  if (!memberError && memberData && memberData.length > 0) {
    const tripIds = memberData.map((m: { trip_id: string }) => m.trip_id)
    const { data } = await supabase
      .from("trips")
      .select("*")
      .in("id", tripIds)
      .is("deleted_at", null)
    memberTrips = data || []
  }

  // Combine and deduplicate by id
  const allTrips = [...(ownedTrips || []), ...memberTrips]
  const uniqueTrips = allTrips.filter((trip, index, self) =>
    index === self.findIndex(t => t.id === trip.id)
  )

  return uniqueTrips
}

function getTripStatus(trip: Trip): "ongoing" | "upcoming" | "past" | "draft" {
  if (!trip.start_date || !trip.end_date) return "draft"

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(trip.start_date)
  const endDate = new Date(trip.end_date)

  if (today >= startDate && today <= endDate) return "ongoing"
  if (today < startDate) return "upcoming"
  return "past"
}

function getDaysUntil(dateString: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateString)
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getTripDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
}

export default async function TripsPage() {
  const trips = await getTrips()

  // Categorize trips
  const categorizedTrips = trips.reduce((acc, trip) => {
    const status = getTripStatus(trip)
    if (!acc[status]) acc[status] = []
    acc[status].push(trip)
    return acc
  }, {} as Record<string, Trip[]>)

  // Sort trips
  const upcomingTrips: Trip[] = (categorizedTrips.upcoming || []).sort((a: Trip, b: Trip) =>
    new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime()
  )

  const pastTrips: Trip[] = (categorizedTrips.past || []).sort((a: Trip, b: Trip) =>
    new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime()
  )

  const ongoingTrips: Trip[] = categorizedTrips.ongoing || []
  const draftTrips: Trip[] = categorizedTrips.draft || []

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Trips</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            View and manage all your travel plans
          </p>
        </div>
        <CreateTripButton />
      </div>

      {/* Stats Bar */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-center">
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">{ongoingTrips.length}</p>
          <p className="text-sm text-green-600 dark:text-green-500">Active</p>
        </div>
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-center">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{upcomingTrips.length}</p>
          <p className="text-sm text-blue-600 dark:text-blue-500">Upcoming</p>
        </div>
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 text-center">
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{pastTrips.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
        </div>
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{draftTrips.length}</p>
          <p className="text-sm text-yellow-600 dark:text-yellow-500">Drafts</p>
        </div>
      </div>

      {trips.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {/* Ongoing Trips */}
          {ongoingTrips.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Currently Traveling
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ongoingTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Trips */}
          {upcomingTrips.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Plane className="h-5 w-5 text-blue-600" />
                Upcoming Trips
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          )}

          {/* Draft Trips */}
          {draftTrips.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Clock className="h-5 w-5 text-yellow-500" />
                Drafts
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {draftTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          )}

          {/* Past Trips */}
          {pastTrips.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Map className="h-5 w-5 text-gray-400" />
                Past Adventures
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pastTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function TripCard({ trip }: { trip: Trip }) {
  const status = getTripStatus(trip)
  const daysUntil = trip.start_date ? getDaysUntil(trip.start_date) : null
  const duration = trip.start_date && trip.end_date
    ? getTripDuration(trip.start_date, trip.end_date)
    : null

  const statusConfig = {
    ongoing: { badge: "On Trip", color: "bg-green-500", textColor: "text-green-500" },
    upcoming: { badge: daysUntil !== null && daysUntil > 0 ? `In ${daysUntil} days` : "Soon", color: "bg-blue-500", textColor: "text-blue-500" },
    past: { badge: "Completed", color: "bg-gray-400", textColor: "text-gray-500" },
    draft: { badge: "Draft", color: "bg-yellow-500", textColor: "text-yellow-500" },
  }

  return (
    <Link href={`/trip/${trip.id}/itinerary`}>
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg dark:bg-gray-800 dark:hover:bg-gray-750">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600">
          {trip.cover_image && (
            <img
              src={trip.cover_image}
              alt={trip.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute right-3 top-3">
          <Badge className={`${statusConfig[status].color} text-white`}>
            {statusConfig[status].badge}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {trip.name}
          </h3>

          <div className="mt-2 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
            {trip.home_base && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {trip.home_base}
              </div>
            )}
            {trip.start_date && trip.end_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDateRange(trip.start_date, trip.end_date)}
              </div>
            )}
            {duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {duration} {duration === 1 ? "day" : "days"}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
        <Map className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No trips yet</h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Start planning your next adventure by creating a new trip.
      </p>
      <div className="mt-6">
        <CreateTripButton variant="default" />
      </div>
    </div>
  )
}
