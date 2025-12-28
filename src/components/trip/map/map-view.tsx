"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { format, parseISO } from "date-fns"
import { MapPin, Layers, Route, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { TripDay, ItineraryItem } from "@/types"
import type mapboxgl from "mapbox-gl"

interface MapViewProps {
  tripId: string
  days: TripDay[]
  items: ItineraryItem[]
  onItemsReorder?: (order: string[]) => void
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// Color palette for days
const dayColors = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
]

export function MapView({ tripId, days, items, onItemsReorder }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showRoutes, setShowRoutes] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeResult, setOptimizeResult] = useState<{
    distanceText: string
    durationText: string
  } | null>(null)

  // Filter items by selected day
  const filteredItems = useMemo(() => {
    if (!selectedDay) return items
    return items.filter((item) => item.day_id === selectedDay)
  }, [items, selectedDay])

  // Calculate map bounds from items with valid coordinates
  const bounds = useMemo(() => {
    const validItems = filteredItems.filter(
      (item) => item.place?.lat != null && item.place?.lng != null
    )
    if (validItems.length === 0) return null

    const lngs = validItems.map((item) => item.place!.lng!)
    const lats = validItems.map((item) => item.place!.lat!)

    return {
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    }
  }, [filteredItems])

  // Get color for a day
  const getDayColor = useCallback(
    (dayId: string) => {
      const index = days.findIndex((d) => d.id === dayId)
      return dayColors[index % dayColors.length]
    },
    [days]
  )

  // Items with valid coordinates
  const itemsWithCoords = useMemo(() => {
    return filteredItems.filter(
      (item) => item.place?.lat != null && item.place?.lng != null
    )
  }, [filteredItems])

  // Optimize route
  async function handleOptimizeRoute() {
    if (itemsWithCoords.length < 2) return

    setOptimizing(true)
    setOptimizeResult(null)

    try {
      const response = await fetch("/api/routes/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          dayId: selectedDay,
          places: itemsWithCoords.map((item) => ({
            id: item.id,
            lat: item.place!.lat,
            lng: item.place!.lng,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Optimization failed")
      }

      const data = await response.json()
      setOptimizeResult({
        distanceText: data.distanceText,
        durationText: data.durationText,
      })

      // Notify parent of new order
      if (onItemsReorder && data.order) {
        onItemsReorder(data.order)
      }
    } catch (error) {
      console.error("Route optimization error:", error)
    } finally {
      setOptimizing(false)
    }
  }

  // Initialize map
  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainer.current || mapRef.current) return

    const initMap = async () => {
      const mapboxglModule = await import("mapbox-gl")
      const mapboxgl = mapboxglModule.default

      // Load CSS dynamically
      if (!document.querySelector('link[href*="mapbox-gl"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css"
        document.head.appendChild(link)
      }

      mapboxgl.accessToken = MAPBOX_TOKEN

      const center = bounds
        ? [(bounds.minLng + bounds.maxLng) / 2, (bounds.minLat + bounds.maxLat) / 2]
        : [0, 20]

      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: center as [number, number],
        zoom: bounds ? 10 : 2,
      })

      map.addControl(new mapboxgl.NavigationControl(), "top-right")

      map.on("load", () => {
        setMapLoaded(true)
      })

      mapRef.current = map
    }

    initMap()

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [MAPBOX_TOKEN])

  // Add markers when map is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const addMarkers = async () => {
      const mapboxgl = (await import("mapbox-gl")).default

      // Clear existing markers
      const existingMarkers = document.querySelectorAll(".mapbox-marker")
      existingMarkers.forEach((m) => m.remove())

      // Add new markers
      itemsWithCoords.forEach((item, index) => {
        const el = document.createElement("div")
        el.className = "mapbox-marker"
        el.style.cssText = `
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: ${item.day_id ? getDayColor(item.day_id) : "#6B7280"};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 2px solid white;
        `
        el.textContent = String(index + 1)
        el.onclick = () => setSelectedItem(item)

        new mapboxgl.Marker(el)
          .setLngLat([item.place!.lng!, item.place!.lat!])
          .addTo(mapRef.current!)
      })
    }

    addMarkers()
  }, [mapLoaded, itemsWithCoords, getDayColor])

  // Fit bounds when filtered items change
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !bounds) return

    mapRef.current.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      { padding: 80, maxZoom: 15, duration: 500 }
    )
  }, [mapLoaded, bounds, selectedDay])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Map is not configured. Add NEXT_PUBLIC_MAPBOX_TOKEN to your
            environment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {/* Map container */}
      <div ref={mapContainer} className="h-full w-full" />

      {/* Controls overlay */}
      <div className="absolute left-4 top-4 flex flex-col gap-2">
        {/* Day filter */}
        <div className="rounded-lg bg-white dark:bg-gray-800 p-2 shadow-lg">
          <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            Filter by day
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedDay(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !selectedDay
                  ? "bg-gray-800 dark:bg-white text-white dark:text-gray-900"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All
            </button>
            {days.map((day, i) => (
              <button
                key={day.id}
                onClick={() =>
                  setSelectedDay(day.id === selectedDay ? null : day.id)
                }
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedDay === day.id
                    ? "text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                style={{
                  backgroundColor:
                    selectedDay === day.id ? dayColors[i % dayColors.length] : undefined,
                }}
              >
                Day {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Route toggle */}
        <Button
          variant={showRoutes ? "default" : "outline"}
          size="sm"
          onClick={() => setShowRoutes(!showRoutes)}
          className="shadow-lg"
        >
          <Route className="mr-1.5 h-4 w-4" />
          Routes
        </Button>

        {/* Optimize route button */}
        {itemsWithCoords.length >= 2 && (
          <div className="space-y-1">
            <Button
              variant="default"
              size="sm"
              onClick={handleOptimizeRoute}
              disabled={optimizing}
              className="w-full shadow-lg bg-purple-600 hover:bg-purple-700"
            >
              {optimizing ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              {optimizing ? "Optimizing..." : "Optimize Route"}
            </Button>
            {optimizeResult && (
              <div className="rounded-lg bg-white dark:bg-gray-800 p-2 text-xs shadow-lg">
                <p className="font-medium text-gray-900 dark:text-white">Optimized!</p>
                <p className="text-gray-600 dark:text-gray-300">{optimizeResult.distanceText}</p>
                <p className="text-gray-600 dark:text-gray-300">{optimizeResult.durationText}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected item popup */}
      {selectedItem && (
        <div className="absolute bottom-4 left-4 right-4 max-w-md rounded-lg bg-white dark:bg-gray-800 p-4 shadow-xl sm:left-auto sm:right-4">
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
          <h3 className="font-semibold text-gray-900 dark:text-white">{selectedItem.title}</h3>
          {selectedItem.place?.address && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {selectedItem.place.address}
            </p>
          )}
          {selectedItem.notes && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{selectedItem.notes}</p>
          )}
          {selectedItem.day_id && (
            <Badge className="mt-2" style={{ backgroundColor: getDayColor(selectedItem.day_id) }}>
              {format(
                parseISO(days.find((d) => d.id === selectedItem.day_id)!.day_date),
                "EEE, MMM d"
              )}
            </Badge>
          )}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-black/30">
          <div className="rounded-lg bg-white dark:bg-gray-800 p-6 text-center shadow-xl">
            <MapPin className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 font-medium text-gray-900 dark:text-white">No places on map</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add places with locations to see them on the map
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
