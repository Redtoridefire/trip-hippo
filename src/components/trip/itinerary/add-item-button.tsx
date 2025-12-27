"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlaceSearch } from "./place-search"
import type { TripDay, TripList, ItineraryItem } from "@/types"

interface SelectedPlace {
  id: string
  name: string
  address: string
  lat?: number
  lng?: number
}

interface AddItemButtonProps {
  tripId: string
  days: TripDay[]
  lists: TripList[]
  onItemCreated: (item: ItineraryItem) => void
}

export function AddItemButton({
  tripId,
  days,
  lists,
  onItemCreated,
}: AddItemButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<"search" | "manual">("search")
  const [title, setTitle] = useState("")
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const itemTitle = selectedPlace?.name || title.trim()
    if (!itemTitle) return

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    // If we have a selected place with coordinates, store it in the places table first
    let placeId = null
    if (selectedPlace?.lat && selectedPlace?.lng) {
      const { data: place } = await supabase
        .from("places")
        .upsert({
          provider: "google",
          provider_place_id: selectedPlace.id,
          name: selectedPlace.name,
          address: selectedPlace.address,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
        }, {
          onConflict: "provider,provider_place_id",
        })
        .select()
        .single()

      placeId = place?.id
    }

    const itemData = {
      trip_id: tripId,
      day_id: selectedDayId || null,
      place_id: placeId,
      title: itemTitle,
      notes: notes.trim() || null,
      sort_order: 999,
      created_by: user?.id,
    }

    const { data, error } = await supabase
      .from("itinerary_items")
      .insert(itemData)
      .select()
      .single()

    setLoading(false)

    if (error) {
      console.error("Error creating item:", error)
      return
    }

    onItemCreated(data)
    resetForm()
  }

  function resetForm() {
    setTitle("")
    setSelectedPlace(null)
    setNotes("")
    setSelectedDayId("")
    setIsOpen(false)
    setMode("search")
  }

  function handlePlaceSelect(place: SelectedPlace) {
    setSelectedPlace(place)
    setTitle(place.name)
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add to itinerary
      </Button>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Add new item</h3>
        <button
          onClick={resetForm}
          className="rounded p-1 text-gray-500 hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="mb-3 flex rounded-lg border border-gray-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "search"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Search Places
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "manual"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Manual Entry
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "search" ? (
          <div>
            <PlaceSearch
              onSelect={handlePlaceSelect}
              placeholder="Search for a place, restaurant, attraction..."
            />
            {selectedPlace && (
              <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-2 text-sm">
                <p className="font-medium text-blue-900">{selectedPlace.name}</p>
                {selectedPlace.address && (
                  <p className="text-blue-700">{selectedPlace.address}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <Input
            placeholder="Place name or activity"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        )}

        <select
          value={selectedDayId}
          onChange={(e) => setSelectedDayId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Unscheduled</option>
          {days.map((day) => (
            <option key={day.id} value={day.id}>
              {new Date(day.day_date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </option>
          ))}
        </select>

        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={loading}
            disabled={mode === "search" ? !selectedPlace : !title.trim()}
          >
            Add Item
          </Button>
        </div>
      </form>
    </div>
  )
}
