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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-white transition-shadow",
        isDragging || isSortableDragging
          ? "border-blue-400 shadow-lg"
          : "border-gray-200 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-2 p-3">
        {/* Drag handle */}
        <button
          className="mt-1 cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-gray-900 truncate">
                {item.title}
              </h4>

              {/* Place info */}
              {place && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  {place.address && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{place.address}</span>
                    </span>
                  )}
                  {place.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {place.rating}
                    </span>
                  )}
                </div>
              )}

              {/* Time */}
              {(item.start_time || item.end_time) && (
                <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
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

          {/* Notes */}
          {item.notes && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {item.notes}
            </p>
          )}

          {/* Links */}
          {item.links && item.links.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
                >
                  <ExternalLink className="h-3 w-3" />
                  {link.label || "Link"}
                </a>
              ))}
            </div>
          )}

          {/* Category badge */}
          {item.category && (
            <div className="mt-2">
              <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {item.category}
              </span>
            </div>
          )}
        </div>

        {/* Place photo */}
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
  )
}
