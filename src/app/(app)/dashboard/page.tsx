import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import type { Trip, Reservation, Expense, ChecklistItem, ItineraryItem, Budget } from "@/types"

interface TripBreakdown {
  active: Trip[]
  upcoming: Trip[]
  completed: Trip[]
  draft: Trip[]
}

interface TripStats {
  totalBudget: number
  totalSpent: number
  reservationCount: number
  itineraryItemCount: number
  checklistTotal: number
  checklistCompleted: number
}

interface TravelInsights {
  topDestinations: { name: string; count: number }[]
  spendingByCategory: { category: string; amount: number }[]
  totalDaysTraveled: number
  averageTripDuration: number
  upcomingReservationsByType: { type: string; count: number }[]
}

interface DashboardData {
  upcomingTrip: (Trip & { stats?: TripStats }) | null
  ongoingTrip: (Trip & { stats?: TripStats }) | null
  upcomingReservations: Reservation[]
  recentTrips: (Trip & { stats?: TripStats })[]
  tripBreakdown: TripBreakdown
  stats: {
    totalTrips: number
    upcomingTrips: number
    totalDestinations: number
    daysUntilNextTrip: number | null
  }
  insights: TravelInsights
  upcomingChecklist: ChecklistItem[]
}

async function getTripStats(supabase: any, tripId: string): Promise<TripStats> {
  const [budgetRes, expensesRes, reservationsRes, itemsRes, checklistRes] = await Promise.all([
    supabase.from("budgets").select("amount").eq("trip_id", tripId).single(),
    supabase.from("expenses").select("amount").eq("trip_id", tripId).is("deleted_at", null),
    supabase.from("reservations").select("id").eq("trip_id", tripId).is("deleted_at", null),
    supabase.from("itinerary_items").select("id").eq("trip_id", tripId).is("deleted_at", null),
    supabase.from("checklist_items").select("id, is_checked").eq("trip_id", tripId).is("deleted_at", null),
  ])

  const totalSpent = (expensesRes.data || []).reduce((sum: number, e: { amount: number }) => sum + (e.amount || 0), 0)
  const checklistItems = checklistRes.data || []

  return {
    totalBudget: budgetRes.data?.amount || 0,
    totalSpent,
    reservationCount: reservationsRes.data?.length || 0,
    itineraryItemCount: itemsRes.data?.length || 0,
    checklistTotal: checklistItems.length,
    checklistCompleted: checklistItems.filter((c: { is_checked: boolean }) => c.is_checked).length,
  }
}

async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const emptyData: DashboardData = {
    upcomingTrip: null,
    ongoingTrip: null,
    upcomingReservations: [],
    recentTrips: [],
    tripBreakdown: { active: [], upcoming: [], completed: [], draft: [] },
    stats: { totalTrips: 0, upcomingTrips: 0, totalDestinations: 0, daysUntilNextTrip: null },
    insights: {
      topDestinations: [],
      spendingByCategory: [],
      totalDaysTraveled: 0,
      averageTripDuration: 0,
      upcomingReservationsByType: [],
    },
    upcomingChecklist: [],
  }

  if (!user) return emptyData

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

  // Categorize trips
  const tripBreakdown: TripBreakdown = {
    active: [],
    upcoming: [],
    completed: [],
    draft: [],
  }

  allTrips.forEach((trip) => {
    if (!trip.start_date || !trip.end_date) {
      tripBreakdown.draft.push(trip)
    } else if (trip.start_date <= todayISO && trip.end_date >= todayISO) {
      tripBreakdown.active.push(trip)
    } else if (trip.start_date > todayISO) {
      tripBreakdown.upcoming.push(trip)
    } else {
      tripBreakdown.completed.push(trip)
    }
  })

  // Sort upcoming by date
  tripBreakdown.upcoming.sort((a, b) =>
    new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime()
  )
  tripBreakdown.completed.sort((a, b) =>
    new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime()
  )

  // Find featured trips
  const ongoingTrip = tripBreakdown.active[0] || null
  const upcomingTrip = tripBreakdown.upcoming[0] || null
  const featuredTrip = ongoingTrip || upcomingTrip

  // Get stats for featured trip
  let featuredStats: TripStats | undefined
  if (featuredTrip) {
    featuredStats = await getTripStats(supabase, featuredTrip.id)
  }

  // Get reservations for upcoming trips
  const upcomingTripIds = tripBreakdown.upcoming.slice(0, 5).map(t => t.id)
  if (ongoingTrip) upcomingTripIds.unshift(ongoingTrip.id)

  let upcomingReservations: Reservation[] = []
  if (upcomingTripIds.length > 0) {
    const { data: reservations } = await supabase
      .from("reservations")
      .select("*")
      .in("trip_id", upcomingTripIds)
      .gte("start_dt", new Date().toISOString())
      .is("deleted_at", null)
      .order("start_dt", { ascending: true })
      .limit(8)

    upcomingReservations = (reservations || []) as Reservation[]
  }

  // Get recent/past trips with stats
  const recentTripsRaw = tripBreakdown.completed.slice(0, 5)
  const recentTrips = await Promise.all(
    recentTripsRaw.map(async (trip) => {
      const stats = await getTripStats(supabase, trip.id)
      return { ...trip, stats }
    })
  )

  // Calculate destinations
  const destinations = new Set(allTrips.map(t => t.home_base).filter(Boolean))

  // Calculate days until next trip
  let daysUntilNextTrip: number | null = null
  if (upcomingTrip?.start_date) {
    const nextDate = new Date(upcomingTrip.start_date)
    const diff = nextDate.getTime() - today.getTime()
    daysUntilNextTrip = Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // Get all expenses for insights
  const allTripIds = allTrips.map(t => t.id)
  let allExpenses: Expense[] = []
  if (allTripIds.length > 0) {
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*")
      .in("trip_id", allTripIds)
      .is("deleted_at", null)
    allExpenses = (expenses || []) as Expense[]
  }

  // Calculate spending by category
  const spendingByCategory: Record<string, number> = {}
  allExpenses.forEach((expense) => {
    const cat = expense.category || "other"
    spendingByCategory[cat] = (spendingByCategory[cat] || 0) + expense.amount
  })

  // Calculate top destinations
  const destinationCounts: Record<string, number> = {}
  allTrips.forEach((trip) => {
    if (trip.home_base) {
      destinationCounts[trip.home_base] = (destinationCounts[trip.home_base] || 0) + 1
    }
  })

  // Calculate total days traveled
  let totalDaysTraveled = 0
  tripBreakdown.completed.forEach((trip) => {
    if (trip.start_date && trip.end_date) {
      const start = new Date(trip.start_date)
      const end = new Date(trip.end_date)
      totalDaysTraveled += Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }
  })

  // Average trip duration
  const completedWithDates = tripBreakdown.completed.filter(t => t.start_date && t.end_date)
  const averageTripDuration = completedWithDates.length > 0
    ? Math.round(totalDaysTraveled / completedWithDates.length)
    : 0

  // Upcoming reservations by type
  const reservationsByType: Record<string, number> = {}
  upcomingReservations.forEach((res) => {
    reservationsByType[res.type] = (reservationsByType[res.type] || 0) + 1
  })

  // Get upcoming checklist items
  let upcomingChecklist: ChecklistItem[] = []
  if (upcomingTripIds.length > 0) {
    const { data: checklistItems } = await supabase
      .from("checklist_items")
      .select("*")
      .in("trip_id", upcomingTripIds)
      .eq("is_checked", false)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(5)

    upcomingChecklist = (checklistItems || []) as ChecklistItem[]
  }

  return {
    upcomingTrip: ongoingTrip ? null : (upcomingTrip ? { ...upcomingTrip, stats: featuredStats } : null),
    ongoingTrip: ongoingTrip ? { ...ongoingTrip, stats: featuredStats } : null,
    upcomingReservations,
    recentTrips,
    tripBreakdown,
    stats: {
      totalTrips: allTrips.length,
      upcomingTrips: tripBreakdown.upcoming.length,
      totalDestinations: destinations.size,
      daysUntilNextTrip,
    },
    insights: {
      topDestinations: Object.entries(destinationCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      spendingByCategory: Object.entries(spendingByCategory)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
      totalDaysTraveled,
      averageTripDuration,
      upcomingReservationsByType: Object.entries(reservationsByType)
        .map(([type, count]) => ({ type, count })),
    },
    upcomingChecklist,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return <DashboardClient data={data} />
}
