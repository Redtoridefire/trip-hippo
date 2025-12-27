"use client"

import { useState, useRef, useEffect } from "react"
import { Search, MapPin, Loader2, X } from "lucide-react"

interface PlaceResult {
  id: string
  name: string
  address: string
  lat?: number
  lng?: number
}

interface PlaceSuggestion {
  placeId: string
  name: string
  address: string
}

interface PlaceSearchProps {
  onSelect: (place: PlaceResult) => void
  placeholder?: string
  defaultValue?: string
}

export function PlaceSearch({
  onSelect,
  placeholder = "Search for a place...",
  defaultValue = "",
}: PlaceSearchProps) {
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function searchPlaces(input: string) {
    if (input.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error("Place search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleInputChange(value: string) {
    setQuery(value)

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      searchPlaces(value)
    }, 300)
  }

  async function handleSelectSuggestion(suggestion: PlaceSuggestion) {
    setQuery(suggestion.name)
    setShowSuggestions(false)
    setSuggestions([])

    // Get full place details
    try {
      const response = await fetch(`/api/places/search?query=${encodeURIComponent(suggestion.name)}`)
      if (response.ok) {
        const data = await response.json()
        const place = data.places?.[0]
        if (place) {
          onSelect({
            id: place.id,
            name: place.name,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
          })
          return
        }
      }
    } catch (error) {
      console.error("Error getting place details:", error)
    }

    // Fallback: just use the suggestion data
    onSelect({
      id: suggestion.placeId,
      name: suggestion.name,
      address: suggestion.address,
    })
  }

  function handleClear() {
    setQuery("")
    setSuggestions([])
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-gray-50"
            >
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {suggestion.name}
                </p>
                {suggestion.address && (
                  <p className="truncate text-xs text-gray-500">
                    {suggestion.address}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
