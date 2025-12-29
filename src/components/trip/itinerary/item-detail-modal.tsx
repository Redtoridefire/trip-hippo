"use client"

import { useState } from "react"
import {
  X,
  MapPin,
  Clock,
  Star,
  Phone,
  Globe,
  DollarSign,
  ExternalLink,
  Calendar,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Tag,
  Edit2,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ItineraryItem } from "@/types"

interface ItemDetailModalProps {
  item: ItineraryItem
  isOpen: boolean
  onClose: () => void
  onUpdate: (item: ItineraryItem) => void
  onDelete: (id: string) => void
}

export function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: ItemDetailModalProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState(item.notes || "")
  const [editedStartTime, setEditedStartTime] = useState(item.start_time || "")
  const [editedEndTime, setEditedEndTime] = useState(item.end_time || "")

  if (!isOpen) return null

  const place = item.place
  const photos = place?.photos || []

  const handlePrevPhoto = () => {
    setSelectedPhotoIndex((prev) =>
      prev === 0 ? photos.length - 1 : prev - 1
    )
  }

  const handleNextPhoto = () => {
    setSelectedPhotoIndex((prev) =>
      prev === photos.length - 1 ? 0 : prev + 1
    )
  }

  const handleSaveEdits = () => {
    onUpdate({
      ...item,
      notes: editedNotes,
      start_time: editedStartTime || undefined,
      end_time: editedEndTime || undefined,
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to remove this item?")) {
      onDelete(item.id)
      onClose()
    }
  }

  // Render star rating
  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-5 w-5",
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            )}
          />
        ))}
        <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
          {rating.toFixed(1)}
        </span>
      </div>
    )
  }

  // Render price level
  const renderPriceLevel = (level: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(4)].map((_, i) => (
          <DollarSign
            key={i}
            className={cn(
              "h-5 w-5",
              i < level ? "text-green-600 dark:text-green-400" : "text-gray-300 dark:text-gray-600"
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with photo */}
        {photos.length > 0 ? (
          <div className="relative h-64 bg-gray-200 dark:bg-gray-800">
            <img
              src={photos[selectedPhotoIndex]}
              alt={item.title}
              className="h-full w-full object-cover"
            />
            {/* Photo navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={handlePrevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhotoIndex(i)}
                      className={cn(
                        "h-2 w-2 rounded-full transition-all",
                        i === selectedPhotoIndex
                          ? "bg-white w-4"
                          : "bg-white/50 hover:bg-white/70"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
            {/* Photo counter */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
              <ImageIcon className="h-3 w-3" />
              {selectedPhotoIndex + 1} / {photos.length}
            </div>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <MapPin className="h-12 w-12 text-white/50" />
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full bg-black/30 p-2 text-white hover:bg-black/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Photo thumbnails */}
        {photos.length > 1 && (
          <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-800 overflow-x-auto">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setSelectedPhotoIndex(index)}
                className={cn(
                  "h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg transition-all",
                  selectedPhotoIndex === index
                    ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800"
                    : "opacity-60 hover:opacity-100"
                )}
              >
                <img
                  src={photo}
                  alt={`${item.title} ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-16rem)] p-6 space-y-6">
          {/* Title and actions */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {item.title}
              </h2>
              {item.category && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300">
                  <Tag className="h-3.5 w-3.5" />
                  {item.category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Rating and Price */}
          {place && (place.rating || place.price_level) && (
            <div className="flex flex-wrap items-center gap-6">
              {place.rating && renderRating(place.rating)}
              {place.price_level && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Price:</span>
                  {renderPriceLevel(place.price_level)}
                </div>
              )}
            </div>
          )}

          {/* Address */}
          {place?.address && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white">{place.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Get directions
                </a>
              </div>
            </div>
          )}

          {/* Time - Editable */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Time</span>
            </div>
            {isEditing ? (
              <div className="flex items-center gap-3">
                <Input
                  type="time"
                  value={editedStartTime}
                  onChange={(e) => setEditedStartTime(e.target.value)}
                  className="w-32"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="time"
                  value={editedEndTime}
                  onChange={(e) => setEditedEndTime(e.target.value)}
                  className="w-32"
                />
              </div>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                {item.start_time || item.end_time ? (
                  <>
                    {item.start_time && <span>{item.start_time}</span>}
                    {item.start_time && item.end_time && <span> - </span>}
                    {item.end_time && <span>{item.end_time}</span>}
                  </>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 italic">No time set</span>
                )}
              </p>
            )}
          </div>

          {/* Description */}
          {place?.description && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                <FileText className="h-4 w-4" />
                About
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {place.description}
              </p>
            </div>
          )}

          {/* Notes - Editable */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              <FileText className="h-4 w-4" />
              Notes
            </h3>
            {isEditing ? (
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add notes about this place..."
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {item.notes || (
                  <span className="text-gray-400 dark:text-gray-500 italic">No notes yet</span>
                )}
              </p>
            )}
          </div>

          {/* Opening Hours */}
          {place?.opening_hours && place.opening_hours.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                <Calendar className="h-4 w-4" />
                Opening Hours
              </h3>
              <div className="grid gap-1 text-sm">
                {place.opening_hours.map((hours, i) => (
                  <p key={i} className="text-gray-700 dark:text-gray-300">
                    {hours}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Contact & Links */}
          <div className="flex flex-wrap gap-3">
            {place?.phone && (
              <a
                href={`tel:${place.phone}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                className="inline-flex items-center gap-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 px-4 py-2.5 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <Globe className="h-4 w-4" />
                Visit website
              </a>
            )}
          </div>

          {/* Additional Links */}
          {item.links && item.links.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                <ExternalLink className="h-4 w-4" />
                Links
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {link.label || "Link"}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Save button when editing */}
        {isEditing && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdits}>
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
