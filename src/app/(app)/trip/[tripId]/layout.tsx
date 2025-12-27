import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TripHeader } from "@/components/trip/trip-header"
import { TripNav } from "@/components/trip/trip-nav"
import type { Trip, TripMember } from "@/types"

async function getTrip(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: trip, error } = await supabase
    .from("trips")
    .select(`
      *,
      trip_members(*)
    `)
    .eq("id", tripId)
    .is("deleted_at", null)
    .single()

  if (error || !trip) {
    return null
  }

  // Check if user has access
  const isOwner = trip.owner_id === user.id
  const isMember = trip.trip_members?.some(
    (m: TripMember) => m.user_id === user.id && m.accepted_at
  )
  const isPublic = trip.settings?.is_public === true

  if (!isOwner && !isMember && !isPublic) {
    return null
  }

  return {
    trip,
    userRole: isOwner ? "owner" : (trip.trip_members?.find((m: TripMember) => m.user_id === user.id)?.role || "viewer"),
    userId: user.id,
  }
}

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const data = await getTrip(tripId)

  if (!data) {
    notFound()
  }

  const { trip, userRole, userId } = data

  return (
    <div className="flex h-full flex-col">
      <TripHeader trip={trip} userRole={userRole} />
      <TripNav tripId={tripId} />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
