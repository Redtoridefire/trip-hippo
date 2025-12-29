"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, MapPin, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CreateTripModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateTripModal({ isOpen, onClose }: CreateTripModalProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [destination, setDestination] = useState("")
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
    if (!user) {
      setError("You must be logged in to create a trip")
      setLoading(false)
      return
    }

    const tripData = {
      owner_id: user.id,
      name: name.trim(),
      home_base: destination.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
    }

    const { data: trip, error: insertError } = await supabase
      .from("trips")
      .insert(tripData)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Create days for the date range
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const days = []

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push({
          trip_id: trip.id,
          day_date: d.toISOString().split("T")[0],
        })
      }

      if (days.length > 0) {
        await supabase.from("trip_days").insert(days)
      }
    }

    router.push(`/trip/${trip.id}/itinerary`)
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create a new trip</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <Input
            label="Trip name"
            placeholder="Summer vacation 2025"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="relative">
            <Input
              label="Destination (optional)"
              placeholder="Paris, France"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <MapPin className="absolute right-3 top-8 h-5 w-5 text-gray-400" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="End date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
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
              Create Trip
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
