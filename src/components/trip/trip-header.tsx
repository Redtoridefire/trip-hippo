"use client"

import Link from "next/link"
import { ArrowLeft, Share2, Settings, MapPin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDateRange } from "@/lib/utils"
import type { Trip, MemberRole } from "@/types"

interface TripHeaderProps {
  trip: Trip
  userRole: MemberRole
}

export function TripHeader({ trip, userRole }: TripHeaderProps) {
  const hasDateRange = trip.start_date && trip.end_date

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 lg:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard"
            className="mt-1 rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{trip.name}</h1>
              <Badge variant="outline" className="text-xs capitalize">
                {userRole}
              </Badge>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
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
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          {userRole === "owner" && (
            <Link href={`/trip/${trip.id}/settings`}>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
