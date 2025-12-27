"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  X,
  Loader2,
  Check,
  Plane,
  Hotel,
  Car,
  Train,
  Calendar,
  AlertCircle,
} from "lucide-react"
import type { Reservation } from "@/types"

interface ImportReservationProps {
  tripId: string
  onImported: (reservation: Reservation) => void
  onClose: () => void
}

interface ParsedReservation {
  type: string
  provider: string | null
  confirmation: string | null
  title: string | null
  start_dt: string | null
  end_dt: string | null
  metadata: Record<string, unknown>
}

export function ImportReservation({ tripId, onImported, onClose }: ImportReservationProps) {
  const [content, setContent] = useState("")
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedReservation | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleParse() {
    if (!content.trim()) return

    setParsing(true)
    setError(null)
    setParsed(null)

    try {
      const response = await fetch("/api/reservations/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, tripId }),
      })

      if (!response.ok) {
        throw new Error("Failed to parse reservation")
      }

      const data = await response.json()
      setParsed(data.reservation)
    } catch (err) {
      setError("Failed to parse reservation. Please try again or enter details manually.")
    } finally {
      setParsing(false)
    }
  }

  async function handleSave() {
    if (!parsed) return

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const reservationData = {
      trip_id: tripId,
      type: parsed.type,
      provider: parsed.provider,
      confirmation: parsed.confirmation,
      title: parsed.title,
      start_dt: parsed.start_dt,
      end_dt: parsed.end_dt,
      metadata: parsed.metadata,
      source: "email_import",
      created_by: user?.id,
    }

    const { data, error } = await supabase
      .from("reservations")
      .insert(reservationData)
      .select()
      .single()

    setSaving(false)

    if (error) {
      setError("Failed to save reservation")
      return
    }

    onImported(data)
    onClose()
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case "flight":
        return <Plane className="h-5 w-5" />
      case "lodging":
        return <Hotel className="h-5 w-5" />
      case "car":
        return <Car className="h-5 w-5" />
      case "rail":
        return <Train className="h-5 w-5" />
      default:
        return <Calendar className="h-5 w-5" />
    }
  }

  return (
    <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Import Reservation</CardTitle>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-500 hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        {!parsed ? (
          <>
            <p className="mb-3 text-sm text-gray-600">
              Paste your confirmation email or booking details below. Our AI will automatically extract the reservation information.
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your confirmation email content here..."
              rows={8}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleParse}
                disabled={!content.trim() || parsing}
                className="flex-1"
              >
                {parsing ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 h-4 w-4" />
                    Parse Email
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  {getTypeIcon(parsed.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {parsed.title || parsed.provider || "Reservation"}
                    </h3>
                    <Badge variant="secondary">{parsed.type}</Badge>
                  </div>
                  {parsed.provider && (
                    <p className="text-sm text-gray-500">{parsed.provider}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {parsed.confirmation && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Confirmation:</span>
                    <span className="font-medium">{parsed.confirmation}</span>
                  </div>
                )}
                {parsed.start_dt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Start:</span>
                    <span className="font-medium">
                      {new Date(parsed.start_dt).toLocaleString()}
                    </span>
                  </div>
                )}
                {parsed.end_dt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">End:</span>
                    <span className="font-medium">
                      {new Date(parsed.end_dt).toLocaleString()}
                    </span>
                  </div>
                )}
                {parsed.metadata && Object.keys(parsed.metadata).length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <p className="mb-2 text-xs font-medium uppercase text-gray-500">
                      Additional Details
                    </p>
                    {Object.entries(parsed.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-500">
                          {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
                        </span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setParsed(null)}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 h-4 w-4" />
                    Save Reservation
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
