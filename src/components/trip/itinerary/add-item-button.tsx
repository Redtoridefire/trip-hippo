"use client"

import { useState } from "react"
import { Plus, Search, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { TripDay, TripList, ItineraryItem } from "@/types"

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
  const [title, setTitle] = useState("")
  const [selectedDayId, setSelectedDayId] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const itemData = {
      trip_id: tripId,
      day_id: selectedDayId || null,
      title: title.trim(),
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
    setTitle("")
    setNotes("")
    setSelectedDayId("")
    setIsOpen(false)
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
          onClick={() => setIsOpen(false)}
          className="rounded p-1 text-gray-500 hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="Place name or activity"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <select
          value={selectedDayId}
          onChange={(e) => setSelectedDayId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={loading}>
            Add Item
          </Button>
        </div>
      </form>
    </div>
  )
}
