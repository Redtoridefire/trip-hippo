import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { TripList } from "@/components/trips/trip-list"
import { CreateTripButton } from "@/components/trips/create-trip-button"
import { Plus, Map, Calendar } from "lucide-react"

async function getTrips() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Get trips where user is owner or member
  const { data: trips, error } = await supabase
    .from("trips")
    .select(`
      *,
      trip_members!inner(user_id, role, accepted_at)
    `)
    .or(`owner_id.eq.${user.id},trip_members.user_id.eq.${user.id}`)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching trips:", error)
    return []
  }

  return trips || []
}

export default async function DashboardPage() {
  const trips = await getTrips()

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="mt-1 text-gray-600">
            Plan, organize, and share your travel adventures
          </p>
        </div>
        <CreateTripButton />
      </div>

      {/* Trip list or empty state */}
      {trips.length === 0 ? (
        <EmptyState />
      ) : (
        <Suspense fallback={<TripListSkeleton />}>
          <TripList trips={trips} />
        </Suspense>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <Map className="h-8 w-8 text-blue-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">No trips yet</h2>
      <p className="mt-2 text-gray-600">
        Start planning your next adventure by creating a new trip.
      </p>
      <div className="mt-6">
        <CreateTripButton variant="default" />
      </div>

      {/* Feature highlights */}
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <Calendar className="mx-auto mb-2 h-6 w-6 text-blue-600" />
          <h3 className="font-medium text-gray-900">Day-by-day itinerary</h3>
          <p className="mt-1 text-sm text-gray-600">
            Plan each day with activities, times, and notes
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <Map className="mx-auto mb-2 h-6 w-6 text-blue-600" />
          <h3 className="font-medium text-gray-900">Interactive maps</h3>
          <p className="mt-1 text-sm text-gray-600">
            See all your places on a map with routes
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <Plus className="mx-auto mb-2 h-6 w-6 text-blue-600" />
          <h3 className="font-medium text-gray-900">Collaborate together</h3>
          <p className="mt-1 text-sm text-gray-600">
            Invite friends and family to plan together
          </p>
        </div>
      </div>
    </div>
  )
}

function TripListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-xl bg-gray-200"
        />
      ))}
    </div>
  )
}
