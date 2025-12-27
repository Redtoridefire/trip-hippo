"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { createClient } from "@/lib/supabase/client"
import { DayColumn } from "./day-column"
import { ItineraryItemCard } from "./itinerary-item-card"
import { AddItemButton } from "./add-item-button"
import { ListsSection } from "./lists-section"
import { useRealtimeItinerary } from "@/hooks/use-realtime-trip"
import type { TripDay, ItineraryItem, TripList } from "@/types"

interface ItineraryViewProps {
  tripId: string
  days: TripDay[]
  items: ItineraryItem[]
  lists: TripList[]
}

export function ItineraryView({
  tripId,
  days: initialDays,
  items: initialItems,
  lists: initialLists,
}: ItineraryViewProps) {
  const [days] = useState(initialDays)
  const [items, setItems] = useState(initialItems)
  const [lists] = useState(initialLists)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"itinerary" | "lists">("itinerary")

  const supabase = createClient()

  // Real-time sync for collaborative editing
  const handleRealtimeInsert = useCallback((item: ItineraryItem) => {
    setItems((prev) => {
      // Avoid duplicates (if we just added this item locally)
      if (prev.some((i) => i.id === item.id)) return prev
      return [...prev, item]
    })
  }, [])

  const handleRealtimeUpdate = useCallback((item: ItineraryItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, ...item } : i))
    )
  }, [])

  const handleRealtimeDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  // Subscribe to realtime changes
  useRealtimeItinerary(
    tripId,
    handleRealtimeInsert,
    handleRealtimeUpdate,
    handleRealtimeDelete
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const activeItem = activeId
    ? items.find((item) => item.id === activeId)
    : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newItems = arrayMove(items, oldIndex, newIndex)

    // Update sort orders
    const updates = newItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }))

    setItems(newItems)

    // Persist to database
    for (const update of updates) {
      await supabase
        .from("itinerary_items")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id)
    }
  }

  function getItemsForDay(dayId: string) {
    return items.filter((item) => item.day_id === dayId)
  }

  function getUnscheduledItems() {
    return items.filter((item) => !item.day_id && !item.list_name)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50 px-4">
        <button
          onClick={() => setActiveTab("itinerary")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "itinerary"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Itinerary
        </button>
        <button
          onClick={() => setActiveTab("lists")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "lists"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Lists
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        {activeTab === "itinerary" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-6">
              {/* Unscheduled items */}
              {getUnscheduledItems().length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-medium text-gray-700">
                    Unscheduled
                  </h3>
                  <SortableContext
                    items={getUnscheduledItems().map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {getUnscheduledItems().map((item) => (
                        <ItineraryItemCard
                          key={item.id}
                          item={item}
                          onUpdate={(updated) => {
                            setItems(
                              items.map((i) =>
                                i.id === updated.id ? updated : i
                              )
                            )
                          }}
                          onDelete={(id) => {
                            setItems(items.filter((i) => i.id !== id))
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}

              {/* Days */}
              {days.map((day) => (
                <DayColumn
                  key={day.id}
                  day={day}
                  items={getItemsForDay(day.id)}
                  tripId={tripId}
                  onItemsChange={(newItems) => {
                    setItems((prev) => [
                      ...prev.filter((i) => i.day_id !== day.id),
                      ...newItems,
                    ])
                  }}
                />
              ))}

              {/* Empty state */}
              {days.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                  <p className="text-gray-600">
                    No days in this trip yet. Add dates to your trip to start
                    planning your itinerary.
                  </p>
                </div>
              )}
            </div>

            <DragOverlay>
              {activeItem && (
                <ItineraryItemCard
                  item={activeItem}
                  isDragging
                  onUpdate={() => {}}
                  onDelete={() => {}}
                />
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          <ListsSection
            tripId={tripId}
            lists={lists}
            items={items.filter((i) => i.list_name)}
          />
        )}
      </div>

      {/* Add button */}
      <div className="border-t border-gray-200 bg-white p-4">
        <AddItemButton
          tripId={tripId}
          days={days}
          lists={lists}
          onItemCreated={(item) => setItems([...items, item])}
        />
      </div>
    </div>
  )
}
