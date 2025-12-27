"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Globe,
  Lock,
  Users,
  Trash2,
  Loader2,
  Copy,
  Check,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Trip, TripMember, Profile } from "@/types"

export default function TripSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const tripId = params.tripId as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [members, setMembers] = useState<(TripMember & { profile: Profile })[]>([])
  const [isOwner, setIsOwner] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [homeBase, setHomeBase] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadTrip() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: tripData, error } = await supabase
        .from("trips")
        .select(`
          *,
          trip_members(*, profile:profiles(*))
        `)
        .eq("id", tripId)
        .single()

      if (error || !tripData) {
        router.push("/dashboard")
        return
      }

      setTrip(tripData)
      setMembers(tripData.trip_members || [])
      setIsOwner(tripData.owner_id === user.id)

      // Initialize form
      setName(tripData.name || "")
      setHomeBase(tripData.home_base || "")
      setStartDate(tripData.start_date || "")
      setEndDate(tripData.end_date || "")
      setIsPublic(tripData.settings?.is_public || false)

      setLoading(false)
    }

    loadTrip()
  }, [tripId, supabase, router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!trip || !isOwner) return

    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from("trips")
      .update({
        name: name.trim(),
        home_base: homeBase.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        settings: { ...trip.settings, is_public: isPublic },
      })
      .eq("id", tripId)

    setSaving(false)

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Trip updated successfully!" })
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!trip || !isOwner) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${trip.name}"? This action cannot be undone.`
    )

    if (!confirmed) return

    const { error } = await supabase
      .from("trips")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", tripId)

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      router.push("/dashboard")
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    setMessage(null)

    // For now, just show a placeholder message
    // Real implementation would send an email invitation
    setTimeout(() => {
      setInviting(false)
      setMessage({ type: "success", text: `Invitation sent to ${inviteEmail}` })
      setInviteEmail("")
    }, 1000)
  }

  async function copyInviteLink() {
    const link = `${window.location.origin}/invite/${tripId}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function removeMember(memberId: string) {
    const confirmed = window.confirm("Remove this member from the trip?")
    if (!confirmed) return

    const { error } = await supabase
      .from("trip_members")
      .delete()
      .eq("id", memberId)

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMembers(members.filter((m) => m.id !== memberId))
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-2xl p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/trip/${tripId}/itinerary`}
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Trip
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Trip Settings</h1>
          <p className="mt-1 text-gray-600">Manage your trip details and collaborators</p>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Trip Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Trip Name"
                placeholder="Summer vacation 2025"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={!isOwner}
              />

              <Input
                label="Destination"
                placeholder="Paris, France"
                value={homeBase}
                onChange={(e) => setHomeBase(e.target.value)}
                disabled={!isOwner}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!isOwner}
                />
                <Input
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  disabled={!isOwner}
                />
              </div>

              {/* Visibility */}
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
                {isPublic ? (
                  <Globe className="h-5 w-5 text-green-600" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-500" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {isPublic ? "Public Trip" : "Private Trip"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isPublic
                      ? "Anyone with the link can view this trip"
                      : "Only you and collaborators can view this trip"}
                  </p>
                </div>
                {isOwner && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPublic(!isPublic)}
                  >
                    {isPublic ? "Make Private" : "Make Public"}
                  </Button>
                )}
              </div>

              {isOwner && (
                <Button type="submit" loading={saving}>
                  Save Changes
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Collaborators */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaborators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current members */}
            <div className="space-y-2">
              {members.length > 0 ? (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                        {member.profile?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.profile?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    </div>
                    {isOwner && member.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(member.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No collaborators yet</p>
              )}
            </div>

            {/* Invite form */}
            {isOwner && (
              <>
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="mb-3 text-sm font-medium text-gray-900">
                    Invite by email
                  </h4>
                  <form onSubmit={handleInvite} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="friend@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" loading={inviting}>
                      Invite
                    </Button>
                  </form>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Or share invite link:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyInviteLink}
                    className="gap-1"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {isOwner && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
                <div>
                  <p className="font-medium text-red-900">Delete Trip</p>
                  <p className="text-sm text-red-700">
                    Permanently delete this trip and all its data
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-100"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Trip
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
