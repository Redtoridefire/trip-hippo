"use client"

import { format, parseISO } from "date-fns"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { Route, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ItineraryItemCard } from "./itinerary-item-card"
import type { TripDay, ItineraryItem } from "@/types"

interface DayColumnProps {
  day: TripDay
  items: ItineraryItem[]
  tripId: string
  onItemsChange: (items: ItineraryItem[]) => void
}

export function DayColumn({
  day,
  items,
  tripId,
  onItemsChange,
}: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.id}`,
    data: { type: "day", dayId: day.id },
  })

  const date = parseISO(day.day_date)
  const dayOfWeek = format(date, "EEEE")
  const formattedDate = format(date, "MMM d")

  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order)

  function handleUpdate(updated: ItineraryItem) {
    onItemsChange(items.map((i) => (i.id === updated.id ? updated : i)))
  }

  function handleDelete(id: string) {
    onItemsChange(items.filter((i) => i.id !== id))
  }

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border bg-white transition-colors ${
        isOver ? "border-blue-400 bg-blue-50" : "border-gray-200"
      }`}
    >
      {/* Day header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h3 className="font-semibold text-gray-900">{dayOfWeek}</h3>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>

        <div className="flex items-center gap-2">
          {items.length >= 2 && (
            <Button variant="outline" size="sm">
              <Route className="mr-1.5 h-4 w-4" />
              Optimize
            </Button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="p-3">
        {sortedItems.length > 0 ? (
          <SortableContext
            items={sortedItems.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sortedItems.map((item, index) => (
                <div key={item.id}>
                  <ItineraryItemCard
                    item={item}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                  {/* Travel time between items */}
                  {index < sortedItems.length - 1 && (
                    <div className="my-2 flex items-center justify-center">
                      <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Travel time</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
            Drag items here or add new places
          </div>
        )}
      </div>

      {/* Day notes */}
      {day.notes && (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-sm text-gray-600">{day.notes}</p>
        </div>
      )}
    </div>
  )
}
