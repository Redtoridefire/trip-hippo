"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ItineraryItemCard } from "./itinerary-item-card"
import type { TripList, ItineraryItem } from "@/types"

interface ListsSectionProps {
  tripId: string
  lists: TripList[]
  items: ItineraryItem[]
}

export function ListsSection({ tripId, lists: initialLists, items }: ListsSectionProps) {
  const [lists, setLists] = useState(initialLists)
  const [newListName, setNewListName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const supabase = createClient()

  // Group items by list_name
  const itemsByList = items.reduce((acc, item) => {
    const listName = item.list_name || "Other"
    if (!acc[listName]) acc[listName] = []
    acc[listName].push(item)
    return acc
  }, {} as Record<string, ItineraryItem[]>)

  // Default lists if none exist
  const defaultLists = ["Restaurants", "Things to Do", "Shopping"]
  const allListNames = [
    ...new Set([
      ...lists.map((l) => l.name),
      ...Object.keys(itemsByList),
      ...defaultLists,
    ]),
  ]

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault()
    if (!newListName.trim()) return

    setIsCreating(true)

    const { data, error } = await supabase
      .from("trip_lists")
      .insert({
        trip_id: tripId,
        name: newListName.trim(),
        sort_order: lists.length,
      })
      .select()
      .single()

    setIsCreating(false)

    if (!error && data) {
      setLists([...lists, data])
      setNewListName("")
    }
  }

  return (
    <div className="space-y-6">
      {/* List sections */}
      {allListNames.map((listName) => (
        <div
          key={listName}
          className="rounded-lg border border-gray-200 bg-white"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="font-semibold text-gray-900">{listName}</h3>
            <span className="text-sm text-gray-500">
              {(itemsByList[listName] || []).length} items
            </span>
          </div>

          <div className="p-3">
            {(itemsByList[listName] || []).length > 0 ? (
              <div className="space-y-2">
                {(itemsByList[listName] || []).map((item) => (
                  <ItineraryItemCard
                    key={item.id}
                    item={item}
                    onUpdate={() => {}}
                    onDelete={() => {}}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
                No items in this list yet
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Create new list */}
      <form onSubmit={handleCreateList} className="flex gap-2">
        <Input
          placeholder="Create new list..."
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
        />
        <Button type="submit" disabled={!newListName.trim()} loading={isCreating}>
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </form>
    </div>
  )
}
