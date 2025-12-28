"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import {
  Plane,
  Calendar,
  MapPin,
  Clock,
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Timer,
  Globe,
  Luggage,
  TrendingUp,
  Sparkles,
  Building2,
  Car,
  Train,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ListTodo,
  BarChart3,
  PieChart,
  Wallet,
  Utensils,
  ShoppingBag,
  Ticket,
  CircleDot,
  FileText,
  Users,
  CheckSquare,
  Square,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { formatDateRange } from "@/lib/utils"
import type { Trip, Reservation, ReservationType, ChecklistItem } from "@/types"

interface TripStats {
  totalBudget: number
  totalSpent: number
  reservationCount: number
  itineraryItemCount: number
  checklistTotal: number
  checklistCompleted: number
}

interface TripBreakdown {
  active: Trip[]
  upcoming: Trip[]
  completed: Trip[]
  draft: Trip[]
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

interface WeatherData {
  location: string
  temperature: number
  feelsLike: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  high: number
  low: number
  forecast?: { date: string; high: number; low: number; description: string; icon: string }[]
}

interface FlightStatus {
  flightNumber: string
  airline: string
  status: "scheduled" | "active" | "landed" | "cancelled" | "delayed" | "unknown"
  departure: { airport: string; iata: string; scheduled: string; estimated?: string; terminal?: string; gate?: string }
  arrival: { airport: string; iata: string; scheduled: string; estimated?: string; terminal?: string; gate?: string }
  delay?: number
}

const reservationIcons: Record<ReservationType, typeof Plane> = {
  flight: Plane,
  lodging: Building2,
  car: Car,
  rail: Train,
  event: Calendar,
  other: Luggage,
}

const categoryIcons: Record<string, typeof Utensils> = {
  food: Utensils,
  transport: Car,
  lodging: Building2,
  activities: Ticket,
  shopping: ShoppingBag,
  other: DollarSign,
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const { upcomingTrip, ongoingTrip, upcomingReservations, recentTrips, tripBreakdown, stats, insights, upcomingChecklist } = data
  const featuredTrip = ongoingTrip || upcomingTrip

  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [flightNumber, setFlightNumber] = useState("")
  const [flightStatus, setFlightStatus] = useState<FlightStatus | null>(null)
  const [flightLoading, setFlightLoading] = useState(false)
  const [flightError, setFlightError] = useState<string | null>(null)

  // Expandable state
  const [expandedStats, setExpandedStats] = useState<Record<string, boolean>>({})
  const [expandedReservations, setExpandedReservations] = useState<Record<string, boolean>>({})
  const [showInsights, setShowInsights] = useState(false)

  useEffect(() => {
    if (featuredTrip?.home_base) {
      fetchWeather(featuredTrip.home_base)
    }
  }, [featuredTrip?.home_base])

  async function fetchWeather(location: string) {
    setWeatherLoading(true)
    try {
      const res = await fetch(`/api/weather?location=${encodeURIComponent(location)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setWeather(data)
    } catch (error) {
      console.error("Weather fetch error:", error)
    } finally {
      setWeatherLoading(false)
    }
  }

  async function checkFlightStatus() {
    if (!flightNumber.trim()) return
    setFlightLoading(true)
    setFlightError(null)

    try {
      const res = await fetch(`/api/flights/status?flight=${encodeURIComponent(flightNumber.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFlightStatus(data)
    } catch (error: any) {
      setFlightError(error.message || "Failed to fetch flight status")
      setFlightStatus(null)
    } finally {
      setFlightLoading(false)
    }
  }

  const toggleStat = (key: string) => {
    setExpandedStats(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleReservation = (id: string) => {
    setExpandedReservations(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Your travel command center
          </p>
        </div>
        <Link href="/trips">
          <Button variant="outline">
            View All Trips
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Expandable Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ExpandableStatCard
          icon={<Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          label="Total Trips"
          value={stats.totalTrips}
          color="blue"
          isExpanded={expandedStats.totalTrips}
          onToggle={() => toggleStat("totalTrips")}
        >
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <CircleDot className="h-3 w-3 text-green-500" />
                Active
              </span>
              <span className="font-medium text-gray-900 dark:text-white">{tripBreakdown.active.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Plane className="h-3 w-3 text-blue-500" />
                Upcoming
              </span>
              <span className="font-medium text-gray-900 dark:text-white">{tripBreakdown.upcoming.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <CheckCircle2 className="h-3 w-3 text-gray-500" />
                Completed
              </span>
              <span className="font-medium text-gray-900 dark:text-white">{tripBreakdown.completed.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <FileText className="h-3 w-3 text-orange-500" />
                Drafts
              </span>
              <span className="font-medium text-gray-900 dark:text-white">{tripBreakdown.draft.length}</span>
            </div>
          </div>
        </ExpandableStatCard>

        <ExpandableStatCard
          icon={<Plane className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          label="Upcoming"
          value={stats.upcomingTrips}
          color="purple"
          isExpanded={expandedStats.upcoming}
          onToggle={() => toggleStat("upcoming")}
        >
          <div className="mt-3 space-y-2 text-sm max-h-32 overflow-y-auto">
            {tripBreakdown.upcoming.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-2">No upcoming trips</p>
            ) : (
              tripBreakdown.upcoming.slice(0, 4).map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trip/${trip.id}/itinerary`}
                  className="flex justify-between items-center p-2 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30"
                >
                  <span className="truncate text-gray-900 dark:text-white">{trip.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {trip.start_date && format(new Date(trip.start_date), "MMM d")}
                  </span>
                </Link>
              ))
            )}
          </div>
        </ExpandableStatCard>

        <ExpandableStatCard
          icon={<MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />}
          label="Destinations"
          value={stats.totalDestinations}
          color="green"
          isExpanded={expandedStats.destinations}
          onToggle={() => toggleStat("destinations")}
        >
          <div className="mt-3 space-y-2 text-sm max-h-32 overflow-y-auto">
            {insights.topDestinations.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-2">No destinations yet</p>
            ) : (
              insights.topDestinations.map((dest, i) => (
                <div key={dest.name} className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="text-xs font-medium text-green-600">#{i + 1}</span>
                    {dest.name}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{dest.count} {dest.count === 1 ? 'trip' : 'trips'}</span>
                </div>
              ))
            )}
          </div>
        </ExpandableStatCard>

        <ExpandableStatCard
          icon={<Timer className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
          label="Days to Next Trip"
          value={stats.daysUntilNextTrip ?? "—"}
          color="orange"
          isExpanded={expandedStats.countdown}
          onToggle={() => toggleStat("countdown")}
        >
          <div className="mt-3 space-y-2 text-sm">
            {upcomingTrip ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Trip</span>
                  <span className="font-medium text-gray-900 dark:text-white truncate ml-2">{upcomingTrip.name}</span>
                </div>
                {upcomingTrip.home_base && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Destination</span>
                    <span className="font-medium text-gray-900 dark:text-white">{upcomingTrip.home_base}</span>
                  </div>
                )}
                {upcomingTrip.start_date && upcomingTrip.end_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Dates</span>
                    <span className="font-medium text-gray-900 dark:text-white text-xs">
                      {formatDateRange(upcomingTrip.start_date, upcomingTrip.end_date)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-2">No upcoming trips planned</p>
            )}
          </div>
        </ExpandableStatCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enhanced Featured Trip */}
          {featuredTrip && (
            <EnhancedFeaturedTripCard trip={featuredTrip} isOngoing={!!ongoingTrip} />
          )}

          {/* Weather Widget */}
          {weather && (
            <WeatherWidget weather={weather} loading={weatherLoading} />
          )}

          {/* Enhanced Upcoming Reservations */}
          {upcomingReservations.length > 0 && (
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Upcoming Reservations
                  </span>
                  <Badge variant="secondary">{upcomingReservations.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingReservations.map((reservation) => (
                    <ExpandableReservationItem
                      key={reservation.id}
                      reservation={reservation}
                      isExpanded={expandedReservations[reservation.id]}
                      onToggle={() => toggleReservation(reservation.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Travel Insights */}
          {(insights.spendingByCategory.length > 0 || insights.totalDaysTraveled > 0) && (
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <button
                  className="w-full flex items-center justify-between text-base"
                  onClick={() => setShowInsights(!showInsights)}
                >
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Travel Insights
                  </CardTitle>
                  {showInsights ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </CardHeader>
              {showInsights && (
                <CardContent className="space-y-6">
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{insights.totalDaysTraveled}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Days Traveled</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{insights.averageTripDuration}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Avg Trip Length</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tripBreakdown.completed.length}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Trips Completed</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{insights.topDestinations.length}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Unique Places</p>
                    </div>
                  </div>

                  {/* Spending Breakdown */}
                  {insights.spendingByCategory.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        Spending by Category
                      </h4>
                      <div className="space-y-2">
                        {insights.spendingByCategory.map((cat) => {
                          const Icon = categoryIcons[cat.category] || DollarSign
                          const total = insights.spendingByCategory.reduce((sum, c) => sum + c.amount, 0)
                          const percentage = total > 0 ? (cat.amount / total) * 100 : 0
                          return (
                            <div key={cat.category} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400 capitalize">
                                  <Icon className="h-4 w-4" />
                                  {cat.category}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  ${cat.amount.toLocaleString()}
                                </span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reservation Types */}
                  {insights.upcomingReservationsByType.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <ListTodo className="h-4 w-4" />
                        Upcoming Reservation Types
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {insights.upcomingReservationsByType.map((item) => {
                          const Icon = reservationIcons[item.type as ReservationType] || Luggage
                          return (
                            <Badge key={item.type} variant="secondary" className="flex items-center gap-1.5 capitalize">
                              <Icon className="h-3 w-3" />
                              {item.type}: {item.count}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* Right Column - Widgets */}
        <div className="space-y-6">
          {/* Flight Status Checker */}
          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plane className="h-5 w-5 text-blue-600" />
                Flight Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., UA123"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && checkFlightStatus()}
                  className="flex-1"
                />
                <Button onClick={checkFlightStatus} disabled={flightLoading}>
                  {flightLoading ? "..." : "Check"}
                </Button>
              </div>

              {flightError && (
                <p className="mt-3 text-sm text-red-500">{flightError}</p>
              )}

              {flightStatus && (
                <FlightStatusCard flight={flightStatus} />
              )}
            </CardContent>
          </Card>

          {/* Upcoming Checklist Items */}
          {upcomingChecklist.length > 0 && (
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ListTodo className="h-5 w-5 text-amber-600" />
                  To-Do Before Travel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingChecklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                    >
                      <Square className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                        {item.title}
                      </span>
                      {item.list_name && (
                        <Badge variant="outline" className="text-xs">
                          {item.list_name}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/trips" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Luggage className="mr-2 h-4 w-4" />
                  View My Trips
                </Button>
              </Link>
              <Link href="/guides" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Explore Guides
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Enhanced Recent Trips */}
          {recentTrips.length > 0 && (
            <Card className="dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5 text-gray-500" />
                  Recent Trips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTrips.map((trip) => (
                    <Link
                      key={trip.id}
                      href={`/trip/${trip.id}/itinerary`}
                      className="block rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          {trip.cover_image ? (
                            <img src={trip.cover_image} alt="" className="h-full w-full rounded-lg object-cover" />
                          ) : (
                            <MapPin className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{trip.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {trip.end_date && formatDistanceToNow(new Date(trip.end_date), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {trip.stats && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {trip.stats.totalSpent > 0 && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <DollarSign className="h-3 w-3" />
                              {trip.stats.totalSpent.toLocaleString()}
                            </span>
                          )}
                          {trip.stats.itineraryItemCount > 0 && (
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <MapPin className="h-3 w-3" />
                              {trip.stats.itineraryItemCount} places
                            </span>
                          )}
                          {trip.stats.reservationCount > 0 && (
                            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                              <Ticket className="h-3 w-3" />
                              {trip.stats.reservationCount} bookings
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Empty State */}
      {!featuredTrip && stats.totalTrips === 0 && (
        <Card className="p-12 text-center dark:bg-gray-800">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Plane className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Welcome to TripHippo!</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Start planning your next adventure. Create a trip to see weather updates, flight tracking, and more.
          </p>
          <Link href="/trips">
            <Button className="mt-6">
              Create Your First Trip
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}

function ExpandableStatCard({
  icon,
  label,
  value,
  color,
  isExpanded,
  onToggle,
  children,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: "blue" | "purple" | "green" | "orange"
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const bgColors = {
    blue: "bg-blue-50 dark:bg-blue-900/20",
    purple: "bg-purple-50 dark:bg-purple-900/20",
    green: "bg-green-50 dark:bg-green-900/20",
    orange: "bg-orange-50 dark:bg-orange-900/20",
  }

  return (
    <Card className={`${bgColors[color]} border-0 cursor-pointer transition-all hover:shadow-md`} onClick={onToggle}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white dark:bg-gray-800 p-2.5 shadow-sm">
              {icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EnhancedFeaturedTripCard({ trip, isOngoing }: { trip: Trip & { stats?: TripStats }; isOngoing: boolean }) {
  const daysUntil = trip.start_date
    ? Math.ceil((new Date(trip.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const stats = trip.stats
  const budgetProgress = stats && stats.totalBudget > 0
    ? Math.min((stats.totalSpent / stats.totalBudget) * 100, 100)
    : 0
  const checklistProgress = stats && stats.checklistTotal > 0
    ? (stats.checklistCompleted / stats.checklistTotal) * 100
    : 0

  return (
    <Link href={`/trip/${trip.id}/itinerary`}>
      <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 text-white transition-transform hover:scale-[1.01]">
        {trip.cover_image && (
          <div className="absolute inset-0">
            <img src={trip.cover_image} alt={trip.name} className="h-full w-full object-cover opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        <CardContent className="relative p-6">
          <div className="mb-4 flex items-center gap-2">
            {isOngoing ? (
              <Badge className="bg-green-500 text-white">
                <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Currently Traveling
              </Badge>
            ) : (
              <Badge className="bg-white/20 text-white">
                <Plane className="mr-1.5 h-3 w-3" />
                Next Trip
              </Badge>
            )}
          </div>

          <h2 className="text-2xl font-bold">{trip.name}</h2>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-white/80">
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
          </div>

          {/* Trip Stats Grid */}
          {stats && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.reservationCount > 0 && (
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold">{stats.reservationCount}</p>
                  <p className="text-xs text-white/70">Bookings</p>
                </div>
              )}
              {stats.itineraryItemCount > 0 && (
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold">{stats.itineraryItemCount}</p>
                  <p className="text-xs text-white/70">Activities</p>
                </div>
              )}
              {stats.totalBudget > 0 && (
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold">${stats.totalSpent.toLocaleString()}</p>
                  <p className="text-xs text-white/70">of ${stats.totalBudget.toLocaleString()}</p>
                </div>
              )}
              {stats.checklistTotal > 0 && (
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-xl font-bold">{stats.checklistCompleted}/{stats.checklistTotal}</p>
                  <p className="text-xs text-white/70">Checklist</p>
                </div>
              )}
            </div>
          )}

          {/* Progress bars */}
          {stats && (stats.totalBudget > 0 || stats.checklistTotal > 0) && (
            <div className="mt-4 space-y-2">
              {stats.totalBudget > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-white/70 mb-1">
                    <span className="flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      Budget
                    </span>
                    <span>{Math.round(budgetProgress)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        budgetProgress > 90 ? "bg-red-400" : budgetProgress > 70 ? "bg-yellow-400" : "bg-green-400"
                      }`}
                      style={{ width: `${budgetProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {stats.checklistTotal > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-white/70 mb-1">
                    <span className="flex items-center gap-1">
                      <CheckSquare className="h-3 w-3" />
                      Preparation
                    </span>
                    <span>{Math.round(checklistProgress)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all"
                      style={{ width: `${checklistProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
        </CardContent>
      </Card>
    </Link>
  )
}

function WeatherWidget({ weather, loading }: { weather: WeatherData; loading: boolean }) {
  const getWeatherIcon = (icon: string) => {
    if (icon.includes("01")) return <Sun className="h-8 w-8 text-yellow-500" />
    if (icon.includes("09") || icon.includes("10")) return <CloudRain className="h-8 w-8 text-blue-500" />
    return <Cloud className="h-8 w-8 text-gray-400" />
  }

  return (
    <Card className="dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Thermometer className="h-5 w-5 text-orange-500" />
          Weather at {weather.location}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getWeatherIcon(weather.icon)}
            <div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{weather.temperature}°F</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{weather.description}</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p className="flex items-center gap-1 justify-end">
              <span>H: {weather.high}°</span>
              <span className="text-gray-400">|</span>
              <span>L: {weather.low}°</span>
            </p>
            <p className="flex items-center gap-1 justify-end">
              <Droplets className="h-3.5 w-3.5" />
              {weather.humidity}%
            </p>
            <p className="flex items-center gap-1 justify-end">
              <Wind className="h-3.5 w-3.5" />
              {weather.windSpeed} mph
            </p>
          </div>
        </div>

        {weather.forecast && weather.forecast.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-5 gap-2">
              {weather.forecast.map((day, i) => (
                <div key={i} className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(day.date), "EEE")}
                  </p>
                  <div className="my-1 flex justify-center">
                    {getWeatherIcon(day.icon)}
                  </div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{day.high}°</p>
                  <p className="text-xs text-gray-400">{day.low}°</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FlightStatusCard({ flight }: { flight: FlightStatus }) {
  const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
    scheduled: { color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30", icon: Clock, label: "Scheduled" },
    active: { color: "text-green-600 bg-green-100 dark:bg-green-900/30", icon: Plane, label: "In Flight" },
    landed: { color: "text-green-600 bg-green-100 dark:bg-green-900/30", icon: CheckCircle2, label: "Landed" },
    delayed: { color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30", icon: AlertCircle, label: "Delayed" },
    cancelled: { color: "text-red-600 bg-red-100 dark:bg-red-900/30", icon: AlertCircle, label: "Cancelled" },
    unknown: { color: "text-gray-600 bg-gray-100 dark:bg-gray-700", icon: Clock, label: "Unknown" },
  }

  const config = statusConfig[flight.status] || statusConfig.unknown
  const StatusIcon = config.icon

  return (
    <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900 dark:text-white">{flight.flightNumber}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{flight.airline}</p>
        </div>
        <Badge className={config.color}>
          <StatusIcon className="mr-1 h-3 w-3" />
          {config.label}
          {flight.delay && ` (+${flight.delay}m)`}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{flight.departure.iata}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(flight.departure.scheduled), "h:mm a")}
          </p>
          {flight.departure.gate && (
            <p className="text-xs text-gray-400">Gate {flight.departure.gate}</p>
          )}
        </div>
        <div className="flex-1 flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
          <Plane className="h-4 w-4 text-gray-400" />
          <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{flight.arrival.iata}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(flight.arrival.scheduled), "h:mm a")}
          </p>
          {flight.arrival.gate && (
            <p className="text-xs text-gray-400">Gate {flight.arrival.gate}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ExpandableReservationItem({
  reservation,
  isExpanded,
  onToggle,
}: {
  reservation: Reservation
  isExpanded: boolean
  onToggle: () => void
}) {
  const Icon = reservationIcons[reservation.type] || Luggage

  return (
    <div
      className={`rounded-lg bg-gray-50 dark:bg-gray-700/50 transition-all ${
        isExpanded ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <button
        className="w-full flex items-center gap-3 p-3"
        onClick={onToggle}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {reservation.title || reservation.provider || reservation.type}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {reservation.start_dt && format(new Date(reservation.start_dt), "MMM d, h:mm a")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reservation.confirmation && (
            <Badge variant="outline" className="text-xs font-mono hidden sm:flex">
              {reservation.confirmation}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-gray-200 dark:border-gray-600 mt-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {reservation.confirmation && (
              <div className="sm:hidden">
                <p className="text-gray-500 dark:text-gray-400 text-xs">Confirmation</p>
                <p className="font-mono text-gray-900 dark:text-white">{reservation.confirmation}</p>
              </div>
            )}
            {reservation.provider && (
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Provider</p>
                <p className="text-gray-900 dark:text-white">{reservation.provider}</p>
              </div>
            )}
            {reservation.start_dt && (
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Check-in / Start</p>
                <p className="text-gray-900 dark:text-white">
                  {format(new Date(reservation.start_dt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            )}
            {reservation.end_dt && (
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Check-out / End</p>
                <p className="text-gray-900 dark:text-white">
                  {format(new Date(reservation.end_dt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            )}
            {reservation.metadata?.cost && (
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Cost</p>
                <p className="text-green-600 dark:text-green-400 font-medium">
                  ${reservation.metadata.cost.toLocaleString()}
                  {reservation.metadata.currency && ` ${reservation.metadata.currency}`}
                </p>
              </div>
            )}
            {reservation.type === "flight" && reservation.metadata?.flight_number && (
              <>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Flight</p>
                  <p className="text-gray-900 dark:text-white">{reservation.metadata.flight_number}</p>
                </div>
                {reservation.metadata.departure_airport && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Route</p>
                    <p className="text-gray-900 dark:text-white">
                      {reservation.metadata.departure_airport} → {reservation.metadata.arrival_airport}
                    </p>
                  </div>
                )}
              </>
            )}
            {reservation.type === "lodging" && reservation.metadata?.hotel_name && (
              <div className="col-span-2">
                <p className="text-gray-500 dark:text-gray-400 text-xs">Address</p>
                <p className="text-gray-900 dark:text-white">{reservation.metadata.hotel_address}</p>
              </div>
            )}
          </div>
          {reservation.metadata?.notes && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400 text-xs">Notes</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{reservation.metadata.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
