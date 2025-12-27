"use client"

import { useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import type { ItineraryItem, TripDay, ChecklistItem, Reservation, Expense } from "@/types"

type TableName = "itinerary_items" | "trip_days" | "checklist_items" | "reservations" | "expenses"

interface RealtimeCallbacks {
  onItineraryInsert?: (item: ItineraryItem) => void
  onItineraryUpdate?: (item: ItineraryItem) => void
  onItineraryDelete?: (id: string) => void
  onDayInsert?: (day: TripDay) => void
  onDayUpdate?: (day: TripDay) => void
  onDayDelete?: (id: string) => void
  onChecklistInsert?: (item: ChecklistItem) => void
  onChecklistUpdate?: (item: ChecklistItem) => void
  onChecklistDelete?: (id: string) => void
  onReservationInsert?: (reservation: Reservation) => void
  onReservationUpdate?: (reservation: Reservation) => void
  onReservationDelete?: (id: string) => void
  onExpenseInsert?: (expense: Expense) => void
  onExpenseUpdate?: (expense: Expense) => void
  onExpenseDelete?: (id: string) => void
}

export function useRealtimeTrip(tripId: string, callbacks: RealtimeCallbacks) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  const handleChange = useCallback(
    (
      table: TableName,
      payload: RealtimePostgresChangesPayload<Record<string, unknown>>
    ) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      switch (table) {
        case "itinerary_items":
          if (eventType === "INSERT" && callbacks.onItineraryInsert) {
            callbacks.onItineraryInsert(newRecord as unknown as ItineraryItem)
          } else if (eventType === "UPDATE" && callbacks.onItineraryUpdate) {
            callbacks.onItineraryUpdate(newRecord as unknown as ItineraryItem)
          } else if (eventType === "DELETE" && callbacks.onItineraryDelete) {
            callbacks.onItineraryDelete((oldRecord as any).id)
          }
          break

        case "trip_days":
          if (eventType === "INSERT" && callbacks.onDayInsert) {
            callbacks.onDayInsert(newRecord as unknown as TripDay)
          } else if (eventType === "UPDATE" && callbacks.onDayUpdate) {
            callbacks.onDayUpdate(newRecord as unknown as TripDay)
          } else if (eventType === "DELETE" && callbacks.onDayDelete) {
            callbacks.onDayDelete((oldRecord as any).id)
          }
          break

        case "checklist_items":
          if (eventType === "INSERT" && callbacks.onChecklistInsert) {
            callbacks.onChecklistInsert(newRecord as unknown as ChecklistItem)
          } else if (eventType === "UPDATE" && callbacks.onChecklistUpdate) {
            callbacks.onChecklistUpdate(newRecord as unknown as ChecklistItem)
          } else if (eventType === "DELETE" && callbacks.onChecklistDelete) {
            callbacks.onChecklistDelete((oldRecord as any).id)
          }
          break

        case "reservations":
          if (eventType === "INSERT" && callbacks.onReservationInsert) {
            callbacks.onReservationInsert(newRecord as unknown as Reservation)
          } else if (eventType === "UPDATE" && callbacks.onReservationUpdate) {
            callbacks.onReservationUpdate(newRecord as unknown as Reservation)
          } else if (eventType === "DELETE" && callbacks.onReservationDelete) {
            callbacks.onReservationDelete((oldRecord as any).id)
          }
          break

        case "expenses":
          if (eventType === "INSERT" && callbacks.onExpenseInsert) {
            callbacks.onExpenseInsert(newRecord as unknown as Expense)
          } else if (eventType === "UPDATE" && callbacks.onExpenseUpdate) {
            callbacks.onExpenseUpdate(newRecord as unknown as Expense)
          } else if (eventType === "DELETE" && callbacks.onExpenseDelete) {
            callbacks.onExpenseDelete((oldRecord as any).id)
          }
          break
      }
    },
    [callbacks]
  )

  useEffect(() => {
    if (!tripId) return

    // Create a channel for this trip
    const channel = supabase
      .channel(`trip:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "itinerary_items",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => handleChange("itinerary_items", payload)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_days",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => handleChange("trip_days", payload)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "checklist_items",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => handleChange("checklist_items", payload)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => handleChange("reservations", payload)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => handleChange("expenses", payload)
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [tripId, supabase, handleChange])

  return channelRef.current
}

// Simpler hook for just itinerary items
export function useRealtimeItinerary(
  tripId: string,
  onInsert: (item: ItineraryItem) => void,
  onUpdate: (item: ItineraryItem) => void,
  onDelete: (id: string) => void
) {
  return useRealtimeTrip(tripId, {
    onItineraryInsert: onInsert,
    onItineraryUpdate: onUpdate,
    onItineraryDelete: onDelete,
  })
}

// Hook for checklist items
export function useRealtimeChecklist(
  tripId: string,
  onInsert: (item: ChecklistItem) => void,
  onUpdate: (item: ChecklistItem) => void,
  onDelete: (id: string) => void
) {
  return useRealtimeTrip(tripId, {
    onChecklistInsert: onInsert,
    onChecklistUpdate: onUpdate,
    onChecklistDelete: onDelete,
  })
}
