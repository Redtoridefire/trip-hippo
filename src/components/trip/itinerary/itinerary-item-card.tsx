"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  MapPin,
  Clock,
  ExternalLink,
  Trash2,
  MoreHorizontal,
  Star,
  ChevronDown,
  ChevronUp,
  Phone,
  Globe,
  DollarSign,
  Image as ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import type { ItineraryItem } from "@/types"

interface ItineraryItemCardProps {
  item: ItineraryItem
  isDragging?: boolean
  onUpdate: (item: ItineraryItem) => void
  onDelete: (id: string) => void
}

export function ItineraryItemCard({
  item,
  isDragging,
  onUpdate,
  onDelete,
}: ItineraryItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const supabase = createClient()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  async function handleDelete() {
    await supabase
      .from("itinerary_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", item.id)

    onDelete(item.id)
  }

  const place = item.place
  const hasDetails = place && (place.description || place.phone || place.website || (place.photos && place.photos.length > 1) || place.price_level || place.opening_hours)

  // Render star rating
  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-gray-300"
            )}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {rating.toFixed(1)}
        </span>
      </div>
    )
  }

  // Render price level
  const renderPriceLevel = (level: number) => {
    return (
      <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
        {[...Array(4)].map((_, i) => (
          <DollarSign
            key={i}
            className={cn("h-3.5 w-3.5", i < level ? "text-green-600" : "text-gray-300")}
          />
        ))}
      </span>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border transition-all dark:bg-gray-800",
        isDragging || isSortableDragging
          ? "border-blue-400 shadow-lg bg-blue-50 dark:bg-blue-950"
          : "border-gray-200 dark:border-gray-700 hover:shadow-md bg-white dark:bg-gray-800"
      )}
    >
      {/* Main content - always visible */}
      <div className="flex items-start gap-2 p-3">
        {/* Drag handle */}
        <button
          className="mt-1 cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Content */}
        <div
          className="min-w-0 flex-1 cursor-pointer"
          onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {item.title}
                </h4>
                {hasDetails && (
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Place info */}
              {place && (
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  {place.address && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{place.address}</span>
                    </span>
                  )}
                  {place.rating && renderRating(place.rating)}
                  {place.price_level && renderPriceLevel(place.price_level)}
                </div>
              )}

              {/* Time */}
              {(item.start_time || item.end_time) && (
                <div className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  {item.start_time && <span>{item.start_time}</span>}
                  {item.start_time && item.end_time && <span>-</span>}
                  {item.end_time && <span>{item.end_time}</span>}
                </div>
              )}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {place?.website && (
                  <DropdownMenuItem
                    onClick={() => window.open(place.website!, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open website
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDelete} destructive>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Notes preview (when collapsed) */}
          {!isExpanded && item.notes && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {item.notes}
            </p>
          )}

          {/* Category badge */}
          {item.category && (
            <div className="mt-2">
              <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                {item.category}
              </span>
            </div>
          )}
        </div>

        {/* Place photo thumbnail (when collapsed) */}
        {!isExpanded && place?.photos && place.photos.length > 0 && (
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
            <img
              src={place.photos[0]}
              alt={place.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Expanded details section */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-4 pt-3 space-y-4">
          {/* Photo gallery */}
          {place?.photos && place.photos.length > 0 && (
            <div className="space-y-2">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                <img
                  src={place.photos[selectedPhotoIndex]}
                  alt={`${place.name} photo ${selectedPhotoIndex + 1}`}
                  className="h-full w-full object-cover"
                />
                {place.photos.length > 1 && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
                    <ImageIcon className="h-3 w-3" />
                    {selectedPhotoIndex + 1} / {place.photos.length}
                  </div>
                )}
              </div>
              {place.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {place.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhotoIndex(index)}
                      className={cn(
                        "h-12 w-12 flex-shrink-0 overflow-hidden rounded-md transition-all",
                        selectedPhotoIndex === index
                          ? "ring-2 ring-blue-500"
                          : "opacity-70 hover:opacity-100"
                      )}
                    >
                      <img
                        src={photo}
                        alt={`${place.name} thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {place?.description && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                About
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {place.description}
              </p>
            </div>
          )}

          {/* Notes (full when expanded) */}
          {item.notes && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Notes
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {item.notes}
              </p>
            </div>
          )}

          {/* Opening hours */}
          {place?.opening_hours && place.opening_hours.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Opening Hours
              </h5>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                {place.opening_hours.map((hours, i) => (
                  <p key={i}>{hours}</p>
                ))}
              </div>
            </div>
          )}

          {/* Contact info */}
          <div className="flex flex-wrap gap-3">
            {place?.phone && (
              <a
                href={`tel:${place.phone}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Phone className="h-4 w-4" />
                {place.phone}
              </a>
            )}
            {place?.website && (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Globe className="h-4 w-4" />
                Visit website
              </a>
            )}
          </div>

          {/* Links */}
          {item.links && item.links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  <ExternalLink className="h-3 w-3" />
                  {link.label || "Link"}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
