import Link from "next/link"
import { format, differenceInDays, parseISO } from "date-fns"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  CheckSquare,
  Plane,
  Hotel,
  Car,
  Clock,
  ArrowRight,
  Edit,
  Map,
} from "lucide-react"
import type { Trip, TripMember, TripDay, ItineraryItem, Reservation, Expense, ChecklistItem } from "@/types"

interface PageProps {
  params: Promise<{ tripId: string }>
}

async function getTripOverview(tripId: string) {
  const supabase = await createClient()

  // Get trip details
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single()

  // Get members
  const { data: members } = await supabase
    .from("trip_members")
    .select("*, user:profiles(*)")
    .eq("trip_id", tripId)

  // Get days
  const { data: days } = await supabase
    .from("trip_days")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_date", { ascending: true })

  // Get itinerary items with places
  const { data: items } = await supabase
    .from("itinerary_items")
    .select("*, place:places(*)")
    .eq("trip_id", tripId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })

  // Get reservations
  const { data: reservations } = await supabase
    .from("reservations")
    .select("*")
    .eq("trip_id", tripId)
    .is("deleted_at", null)
    .order("start_dt", { ascending: true })

  // Get budget and expenses
  const { data: budget } = await supabase
    .from("budgets")
    .select("*")
    .eq("trip_id", tripId)
    .single()

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId)

  // Get checklist items
  const { data: checklist } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("trip_id", tripId)

  return {
    trip: trip as Trip,
    members: (members || []) as TripMember[],
    days: (days || []) as TripDay[],
    items: (items || []) as ItineraryItem[],
    reservations: (reservations || []) as Reservation[],
    budget: budget || { amount: 0, currency: "USD" },
    expenses: (expenses || []) as Expense[],
    checklist: (checklist || []) as ChecklistItem[],
  }
}

export default async function TripOverviewPage({ params }: PageProps) {
  const { tripId } = await params
  const data = await getTripOverview(tripId)

  if (!data.trip) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Trip not found</p>
      </div>
    )
  }

  const { trip, members, days, items, reservations, budget, expenses, checklist } = data

  // Calculate stats
  const tripDuration = trip.start_date && trip.end_date
    ? differenceInDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1
    : 0

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const budgetRemaining = Number(budget.amount) - totalExpenses
  const budgetPercentage = budget.amount > 0 ? (totalExpenses / Number(budget.amount)) * 100 : 0

  const placesCount = items.filter((i) => i.place).length
  const completedChecklist = checklist.filter((c) => c.is_checked).length

  const upcomingReservations = reservations.filter(
    (r) => r.start_dt && new Date(r.start_dt) >= new Date()
  ).slice(0, 3)

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{trip.name}</h1>
            {trip.description && (
              <p className="mt-1 text-gray-600">{trip.description}</p>
            )}
          </div>
          <Link href={`/trip/${tripId}/settings`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-1.5 h-4 w-4" />
              Edit Trip
            </Button>
          </Link>
        </div>

        {/* Trip dates */}
        {trip.start_date && trip.end_date && (
          <div className="mt-4 flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              {format(parseISO(trip.start_date), "MMM d")} -{" "}
              {format(parseISO(trip.end_date), "MMM d, yyyy")}
            </span>
            <Badge variant="secondary">{tripDuration} days</Badge>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Places"
          value={placesCount}
          icon={<MapPin className="h-5 w-5" />}
          href={`/trip/${tripId}/itinerary`}
        />
        <StatCard
          title="Reservations"
          value={reservations.length}
          icon={<Plane className="h-5 w-5" />}
          href={`/trip/${tripId}/reservations`}
        />
        <StatCard
          title="Checklist"
          value={`${completedChecklist}/${checklist.length}`}
          icon={<CheckSquare className="h-5 w-5" />}
          href={`/trip/${tripId}/checklist`}
        />
        <StatCard
          title="Travelers"
          value={members.length + 1}
          icon={<Users className="h-5 w-5" />}
          href={`/trip/${tripId}/settings`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Budget</CardTitle>
            <Link
              href={`/trip/${tripId}/budget`}
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: budget.currency,
                  }).format(totalExpenses)}
                </p>
                <p className="text-sm text-gray-500">
                  of{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: budget.currency,
                  }).format(Number(budget.amount))}{" "}
                  budget
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Spent</span>
                <span className={budgetRemaining < 0 ? "text-red-600" : "text-green-600"}>
                  {budgetRemaining >= 0 ? "Remaining" : "Over budget"}:{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: budget.currency,
                  }).format(Math.abs(budgetRemaining))}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${
                    budgetPercentage > 100 ? "bg-red-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming reservations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Upcoming Reservations</CardTitle>
            <Link
              href={`/trip/${tripId}/reservations`}
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingReservations.length > 0 ? (
              <div className="space-y-3">
                {upcomingReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                      {getReservationIcon(reservation.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {reservation.title || reservation.provider}
                      </p>
                      {reservation.start_dt && (
                        <p className="text-sm text-gray-500">
                          {format(new Date(reservation.start_dt), "MMM d, h:mm a")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500">No upcoming reservations</p>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href={`/trip/${tripId}/itinerary`}>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Itinerary
                </Button>
              </Link>
              <Link href={`/trip/${tripId}/map`}>
                <Button variant="outline" className="w-full justify-start">
                  <Map className="mr-2 h-4 w-4" />
                  View Map
                </Button>
              </Link>
              <Link href={`/trip/${tripId}/checklist`}>
                <Button variant="outline" className="w-full justify-start">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Packing List
                </Button>
              </Link>
              <Link href={`/trip/${tripId}/assistant`}>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="mr-2 h-4 w-4" />
                  AI Assistant
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Day summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Itinerary Summary</CardTitle>
            <Link
              href={`/trip/${tripId}/itinerary`}
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {days.length > 0 ? (
              <div className="space-y-2">
                {days.slice(0, 5).map((day) => {
                  const dayItems = items.filter((i) => i.day_id === day.id)
                  return (
                    <div
                      key={day.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {format(parseISO(day.day_date), "EEE, MMM d")}
                        </p>
                        <p className="text-sm text-gray-500">
                          {dayItems.length} {dayItems.length === 1 ? "activity" : "activities"}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  )
                })}
                {days.length > 5 && (
                  <p className="text-center text-sm text-gray-500">
                    +{days.length - 5} more days
                  </p>
                )}
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500">
                No days planned yet. Add dates to your trip to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  href,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  href: string
}) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className="text-gray-400">{icon}</div>
        </CardContent>
      </Card>
    </Link>
  )
}

function getReservationIcon(type: string) {
  switch (type) {
    case "flight":
      return <Plane className="h-5 w-5 text-blue-500" />
    case "lodging":
      return <Hotel className="h-5 w-5 text-purple-500" />
    case "car":
      return <Car className="h-5 w-5 text-green-500" />
    default:
      return <Calendar className="h-5 w-5 text-gray-500" />
  }
}
