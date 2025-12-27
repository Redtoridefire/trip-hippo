"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Plane,
  Building2,
  Car,
  Train,
  Ticket,
  MoreHorizontal,
  Plus,
  Calendar,
  FileText,
  ExternalLink,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddReservationModal } from "./add-reservation-modal"
import { ImportReservation } from "./import-reservation"
import type { Reservation, ReservationType } from "@/types"

interface ReservationsViewProps {
  tripId: string
  reservations: Reservation[]
}

const typeIcons: Record<ReservationType, typeof Plane> = {
  flight: Plane,
  lodging: Building2,
  car: Car,
  rail: Train,
  event: Ticket,
  other: FileText,
}

const typeLabels: Record<ReservationType, string> = {
  flight: "Flights",
  lodging: "Lodging",
  car: "Car Rentals",
  rail: "Rail",
  event: "Events",
  other: "Other",
}

export function ReservationsView({
  tripId,
  reservations: initialReservations,
}: ReservationsViewProps) {
  const [reservations, setReservations] = useState(initialReservations)
  const [activeFilter, setActiveFilter] = useState<ReservationType | "all">("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  // Group reservations by type
  const groupedReservations = reservations.reduce((acc, res) => {
    if (!acc[res.type]) acc[res.type] = []
    acc[res.type].push(res)
    return acc
  }, {} as Record<ReservationType, Reservation[]>)

  // Filter reservations
  const filteredReservations =
    activeFilter === "all"
      ? reservations
      : reservations.filter((r) => r.type === activeFilter)

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Reservations</h2>
          <p className="text-sm text-gray-600">
            Keep all your bookings in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import from Email
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Reservation
          </Button>
        </div>
      </div>

      {/* Import section */}
      {isImportOpen && (
        <div className="mb-6">
          <ImportReservation
            tripId={tripId}
            onImported={(res) => {
              setReservations([...reservations, res])
            }}
            onClose={() => setIsImportOpen(false)}
          />
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeFilter === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All ({reservations.length})
        </button>
        {(Object.keys(typeLabels) as ReservationType[]).map((type) => {
          const count = groupedReservations[type]?.length || 0
          if (count === 0) return null
          const Icon = typeIcons[type]
          return (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === type
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {typeLabels[type]} ({count})
            </button>
          )
        })}
      </div>

      {/* Reservations list */}
      {filteredReservations.length > 0 ? (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <ReservationCard key={reservation.id} reservation={reservation} />
          ))}
        </div>
      ) : (
        <EmptyState onAdd={() => setIsAddModalOpen(true)} />
      )}

      {/* Add modal */}
      <AddReservationModal
        tripId={tripId}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={(res) => {
          setReservations([...reservations, res])
          setIsAddModalOpen(false)
        }}
      />
    </div>
  )
}

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const Icon = typeIcons[reservation.type]
  const meta = reservation.metadata

  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">
                {reservation.title || getDefaultTitle(reservation)}
              </h3>
              {reservation.provider && (
                <p className="text-sm text-gray-600">{reservation.provider}</p>
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {reservation.type}
            </Badge>
          </div>

          {/* Details */}
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
            {reservation.start_dt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(reservation.start_dt), "MMM d, yyyy")}
                {reservation.end_dt && (
                  <>
                    {" - "}
                    {format(new Date(reservation.end_dt), "MMM d, yyyy")}
                  </>
                )}
              </span>
            )}
            {reservation.confirmation && (
              <span className="font-mono">#{reservation.confirmation}</span>
            )}
          </div>

          {/* Type-specific metadata */}
          {reservation.type === "flight" && meta.flight_number && (
            <div className="mt-2 rounded-lg bg-gray-50 p-2 text-sm">
              <span className="font-medium">{meta.flight_number}</span>
              {meta.departure_airport && meta.arrival_airport && (
                <span className="text-gray-600">
                  {" "}
                  {meta.departure_airport} → {meta.arrival_airport}
                </span>
              )}
            </div>
          )}

          {reservation.type === "lodging" && meta.hotel_address && (
            <p className="mt-2 text-sm text-gray-600">{meta.hotel_address}</p>
          )}

          {/* Attachments */}
          {reservation.attachments && reservation.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {reservation.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.storage_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                >
                  <FileText className="h-3 w-3" />
                  {att.filename || "Attachment"}
                </a>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getDefaultTitle(reservation: Reservation): string {
  const meta = reservation.metadata
  switch (reservation.type) {
    case "flight":
      return meta.airline || "Flight"
    case "lodging":
      return meta.hotel_name || "Hotel"
    case "car":
      return "Car Rental"
    case "rail":
      return "Train"
    case "event":
      return "Event"
    default:
      return "Reservation"
  }
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
      <Plane className="mx-auto h-10 w-10 text-gray-400" />
      <h3 className="mt-2 font-medium text-gray-900">No reservations yet</h3>
      <p className="mt-1 text-sm text-gray-600">
        Add your flight, hotel, and other bookings to keep everything organized
      </p>
      <Button onClick={onAdd} className="mt-4">
        <Plus className="mr-2 h-4 w-4" />
        Add Reservation
      </Button>
    </div>
  )
}
