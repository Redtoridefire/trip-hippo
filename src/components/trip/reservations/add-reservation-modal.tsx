"use client"

import { useState } from "react"
import { X, Plane, Building2, Car, Train, Ticket, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Reservation, ReservationType } from "@/types"

interface AddReservationModalProps {
  tripId: string
  isOpen: boolean
  onClose: () => void
  onCreated: (reservation: Reservation) => void
}

const reservationTypes: { type: ReservationType; label: string; icon: typeof Plane }[] = [
  { type: "flight", label: "Flight", icon: Plane },
  { type: "lodging", label: "Lodging", icon: Building2 },
  { type: "car", label: "Car", icon: Car },
  { type: "rail", label: "Rail", icon: Train },
  { type: "event", label: "Event", icon: Ticket },
  { type: "other", label: "Other", icon: FileText },
]

export function AddReservationModal({
  tripId,
  isOpen,
  onClose,
  onCreated,
}: AddReservationModalProps) {
  const [type, setType] = useState<ReservationType>("flight")
  const [title, setTitle] = useState("")
  const [provider, setProvider] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const reservationData = {
      trip_id: tripId,
      type,
      title: title.trim() || null,
      provider: provider.trim() || null,
      confirmation: confirmation.trim() || null,
      start_dt: startDate ? new Date(startDate).toISOString() : null,
      end_dt: endDate ? new Date(endDate).toISOString() : null,
      metadata: {},
      created_by: user?.id,
    }

    const { data, error: insertError } = await supabase
      .from("reservations")
      .insert(reservationData)
      .select()
      .single()

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    onCreated(data)
    resetForm()
  }

  function resetForm() {
    setType("flight")
    setTitle("")
    setProvider("")
    setConfirmation("")
    setStartDate("")
    setEndDate("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Reservation
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Type selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {reservationTypes.map(({ type: t, label, icon: Icon }) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors ${
                    type === t
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Title (optional)"
            placeholder="e.g., United Flight 123"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            label="Provider / Company"
            placeholder="e.g., United Airlines, Marriott"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />

          <Input
            label="Confirmation Number"
            placeholder="ABC123"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label={type === "lodging" ? "Check-in" : "Start"}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="datetime-local"
              label={type === "lodging" ? "Check-out" : "End"}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Add Reservation
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
