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
  DollarSign,
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
import { ItemDetailModal } from "./item-detail-modal"
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
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  async function handleUpdate(updated: ItineraryItem) {
    await supabase
      .from("itinerary_items")
      .update({
        notes: updated.notes,
        start_time: updated.start_time,
        end_time: updated.end_time,
      })
      .eq("id", item.id)

    onUpdate(updated)
  }

  const place = item.place

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
              "h-3 w-3",
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            )}
          />
        ))}
        <span className="ml-1 text-xs font-medium text-gray-600 dark:text-gray-400">
          {rating.toFixed(1)}
        </span>
      </div>
    )
  }

  // Render price level
  const renderPriceLevel = (level: number) => {
    return (
      <span className="flex items-center">
        {[...Array(4)].map((_, i) => (
          <DollarSign
            key={i}
            className={cn(
              "h-3 w-3",
              i < level ? "text-green-600 dark:text-green-400" : "text-gray-300 dark:text-gray-600"
            )}
          />
        ))}
      </span>
    )
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group rounded-xl border-2 transition-all cursor-pointer",
          isDragging || isSortableDragging
            ? "border-blue-400 shadow-lg bg-blue-50 dark:bg-blue-950/50"
            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md bg-white dark:bg-gray-800"
        )}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-start gap-2 p-3">
          {/* Drag handle */}
          <button
            className="mt-1 cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 active:cursor-grabbing"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                  {item.title}
                </h4>

                {/* Place info */}
                {place && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    {place.address && (
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 truncate">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{place.address}</span>
                      </span>
                    )}
                    {place.rating && renderRating(place.rating)}
                    {place.price_level && renderPriceLevel(place.price_level)}
                  </div>
                )}

                {/* Time */}
                {(item.start_time || item.end_time) && (
                  <div className="mt-1.5 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    {item.start_time && <span>{item.start_time}</span>}
                    {item.start_time && item.end_time && <span>-</span>}
                    {item.end_time && <span>{item.end_time}</span>}
                  </div>
                )}

                {/* Notes preview */}
                {item.notes && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                    {item.notes}
                  </p>
                )}

                {/* Category badge */}
                {item.category && (
                  <div className="mt-2">
                    <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                      {item.category}
                    </span>
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
                  <DropdownMenuItem
                    onClick={handleDelete}
                    destructive
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Place photo thumbnail */}
          {place?.photos && place.photos.length > 0 && (
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
              <img
                src={place.photos[0]}
                alt={place.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <ItemDetailModal
        item={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdate}
        onDelete={(id) => {
          handleDelete()
          setIsModalOpen(false)
        }}
      />
    </>
  )
}
