"use client"

import Link from "next/link"
import { formatDateRange } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Users } from "lucide-react"
import type { Trip } from "@/types"

interface TripListProps {
  trips: Trip[]
}

export function TripList({ trips }: TripListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  )
}

function TripCard({ trip }: { trip: Trip }) {
  const hasDateRange = trip.start_date && trip.end_date

  return (
    <Link href={`/trip/${trip.id}/itinerary`}>
      <Card className="group relative h-48 overflow-hidden transition-shadow hover:shadow-lg">
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

            {hasDateRange && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDateRange(trip.start_date!, trip.end_date!)}
              </span>
            )}
          </div>
        </div>

        {/* Status badge */}
        {!hasDateRange && (
          <div className="absolute right-3 top-3">
            <Badge variant="secondary" className="bg-white/20 text-white">
              Draft
            </Badge>
          </div>
        )}
      </Card>
    </Link>
  )
}
