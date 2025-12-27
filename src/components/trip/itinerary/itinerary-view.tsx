"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
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

  function findContainer(id: string): string | null {
    // Check if it's a day container (format: day-{uuid})
    if (id.startsWith("day-")) {
      const dayId = id.replace("day-", "")
      if (days.some(d => d.id === dayId)) return dayId
    }
    if (id === "unscheduled") return "unscheduled"

    // Find which day contains this item
    const item = items.find(i => i.id === id)
    if (item) {
      return item.day_id || "unscheduled"
    }
    return null
  }

  async function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeContainer = findContainer(activeId)
    const overContainer = findContainer(overId)

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return
    }

    // Moving to a different container
    setItems((prev) => {
      const activeItem = prev.find(i => i.id === activeId)
      if (!activeItem) return prev

      const newDayId = overContainer === "unscheduled" ? undefined : overContainer

      return prev.map(item =>
        item.id === activeId
          ? { ...item, day_id: newDayId }
          : item
      )
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeItem = items.find(i => i.id === activeId)
    if (!activeItem) return

    // Determine the target day
    let targetDayId: string | undefined = undefined
    if (overId.startsWith("day-")) {
      // Dropped directly on a day container
      targetDayId = overId.replace("day-", "")
    } else if (overId === "unscheduled") {
      targetDayId = undefined
    } else {
      // Dropped on another item - use that item's day
      const overItem = items.find(i => i.id === overId)
      targetDayId = overItem?.day_id
    }

    // Get items in the target container
    const containerItems = items.filter(i =>
      targetDayId ? i.day_id === targetDayId : (!i.day_id && !i.list_name)
    )

    // Find positions for reordering within container
    const activeIndex = containerItems.findIndex(i => i.id === activeId)
    const overIndex = containerItems.findIndex(i => i.id === overId)

    let newOrder = [...containerItems]
    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      newOrder = arrayMove(containerItems, activeIndex, overIndex)
    }

    // Update items with new order and day_id
    const updatedItems = items.map(item => {
      if (item.id === activeId) {
        return { ...item, day_id: targetDayId }
      }
      const orderIndex = newOrder.findIndex(i => i.id === item.id)
      if (orderIndex !== -1) {
        return { ...item, sort_order: orderIndex }
      }
      return item
    })

    setItems(updatedItems)

    // Persist changes to database
    await supabase
      .from("itinerary_items")
      .update({
        day_id: targetDayId,
        sort_order: newOrder.findIndex(i => i.id === activeId)
      })
      .eq("id", activeId)

    // Update sort orders for other items in the container
    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i].id !== activeId) {
        await supabase
          .from("itinerary_items")
          .update({ sort_order: i })
          .eq("id", newOrder[i].id)
      }
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
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-6">
              {/* Unscheduled items */}
              <UnscheduledDropzone>
                <SortableContext
                  items={getUnscheduledItems().map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {getUnscheduledItems().length > 0 ? (
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
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
                      Drag items here to unschedule them
                    </div>
                  )}
                </SortableContext>
              </UnscheduledDropzone>

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

// Droppable component for unscheduled items
function UnscheduledDropzone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "unscheduled",
  })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border bg-white p-4 transition-colors ${
        isOver ? "border-blue-400 bg-blue-50" : "border-gray-200"
      }`}
    >
      <h3 className="mb-3 text-sm font-medium text-gray-700">Unscheduled</h3>
      {children}
    </div>
  )
}
