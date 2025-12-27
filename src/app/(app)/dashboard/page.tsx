import { createClient } from "@/lib/supabase/server"
import { CreateTripButton } from "@/components/trips/create-trip-button"
import { Plus, Map, Calendar, Clock, MapPin, ArrowRight, Plane } from "lucide-react"
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

export default async function DashboardPage() {
  const trips = await getTrips()

  // Categorize trips
  const categorizedTrips = trips.reduce((acc, trip) => {
    const status = getTripStatus(trip)
    if (!acc[status]) acc[status] = []
    acc[status].push(trip)
    return acc
  }, {} as Record<string, Trip[]>)

  // Sort upcoming trips by start date
  const upcomingTrips: Trip[] = (categorizedTrips.upcoming || []).sort((a: Trip, b: Trip) =>
    new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime()
  )

  // Sort past trips by end date (most recent first)
  const pastTrips: Trip[] = (categorizedTrips.past || []).sort((a: Trip, b: Trip) =>
    new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime()
  )

  const ongoingTrips: Trip[] = categorizedTrips.ongoing || []
  const draftTrips: Trip[] = categorizedTrips.draft || []

  // Get the featured trip (ongoing first, then next upcoming)
  const featuredTrip = ongoingTrips[0] || upcomingTrips[0]

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Trips</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Plan, organize, and share your travel adventures
          </p>
        </div>
        <CreateTripButton />
      </div>

      {trips.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {/* Featured Trip Spotlight */}
          {featuredTrip && (
            <FeaturedTrip trip={featuredTrip} />
          )}

          {/* Ongoing Trips */}
          {ongoingTrips.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Currently Traveling
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ongoingTrips.map((trip) => (
                  <TripCardEnhanced key={trip.id} trip={trip} />
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
                  <TripCardEnhanced key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          )}

          {/* Draft Trips */}
          {draftTrips.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Clock className="h-5 w-5 text-gray-400" />
                Drafts
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {draftTrips.map((trip) => (
                  <TripCardEnhanced key={trip.id} trip={trip} />
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
                  <TripCardEnhanced key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function FeaturedTrip({ trip }: { trip: Trip }) {
  const status = getTripStatus(trip)
  const isOngoing = status === "ongoing"
  const daysUntil = trip.start_date ? getDaysUntil(trip.start_date) : null
  const duration = trip.start_date && trip.end_date
    ? getTripDuration(trip.start_date, trip.end_date)
    : null

  return (
    <Link href={`/trip/${trip.id}/itinerary`}>
      <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 p-6 text-white transition-transform hover:scale-[1.01]">
        {trip.cover_image && (
          <div className="absolute inset-0">
            <img
              src={trip.cover_image}
              alt={trip.name}
              className="h-full w-full object-cover opacity-30"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="relative">
          <div className="mb-4 flex items-center gap-2">
            {isOngoing ? (
              <Badge className="bg-green-500 text-white">
                <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                On Your Trip
              </Badge>
            ) : (
              <Badge className="bg-white/20 text-white">
                <Plane className="mr-1.5 h-3 w-3" />
                Next Adventure
              </Badge>
            )}
          </div>

          <h2 className="text-2xl font-bold">{trip.name}</h2>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-white/80">
            {trip.home_base && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {trip.home_base}
              </span>
            )}
            {trip.start_date && trip.end_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDateRange(trip.start_date, trip.end_date)}
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {duration} {duration === 1 ? "day" : "days"}
              </span>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            {!isOngoing && daysUntil !== null && daysUntil > 0 && (
              <div>
                <p className="text-3xl font-bold">{daysUntil}</p>
                <p className="text-sm text-white/70">days until departure</p>
              </div>
            )}
            {isOngoing && (
              <div>
                <p className="text-lg font-medium">Enjoy your trip!</p>
                <p className="text-sm text-white/70">View your itinerary</p>
              </div>
            )}
            <div className="flex items-center gap-1 text-sm font-medium group-hover:underline">
              View Trip
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

function TripCardEnhanced({ trip }: { trip: Trip }) {
  const status = getTripStatus(trip)
  const daysUntil = trip.start_date ? getDaysUntil(trip.start_date) : null

  const statusConfig = {
    ongoing: { badge: "On Trip", color: "bg-green-500" },
    upcoming: { badge: daysUntil !== null && daysUntil > 0 ? `${daysUntil}d` : "Soon", color: "bg-blue-500" },
    past: { badge: "Completed", color: "bg-gray-400" },
    draft: { badge: "Draft", color: "bg-yellow-500" },
  }

  return (
    <Link href={`/trip/${trip.id}/itinerary`}>
      <Card className="group relative h-48 overflow-hidden transition-shadow hover:shadow-lg dark:bg-gray-800">
        {/* Cover image or gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600">
          {trip.cover_image && (
            <img
              src={trip.cover_image}
              alt={trip.name}
              className="h-full w-full object-cover opacity-80"
            />
          )}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Status badge */}
        <div className="absolute right-3 top-3">
          <Badge className={`${statusConfig[status].color} text-white`}>
            {statusConfig[status].badge}
          </Badge>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-semibold group-hover:underline">
            {trip.name}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/80">
            {trip.home_base && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {trip.home_base}
              </span>
            )}

            {trip.start_date && trip.end_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDateRange(trip.start_date, trip.end_date)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
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

      {/* Feature highlights */}
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
          <Calendar className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">Day-by-day itinerary</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Plan each day with activities, times, and notes
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
          <Map className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">Interactive maps</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            See all your places on a map with routes
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-700">
          <Plus className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">Collaborate together</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Invite friends and family to plan together
          </p>
        </div>
      </div>
    </div>
  )
}
