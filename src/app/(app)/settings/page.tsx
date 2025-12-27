"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Mail, Camera, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Profile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  bio: string | null
  is_public: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setName(profileData.name || "")
        setBio(profileData.bio || "")
        setIsPublic(profileData.is_public || false)
      }
      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim() || null,
        bio: bio.trim() || null,
        is_public: isPublic,
      })
      .eq("id", profile.id)

    setSaving(false)

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Profile updated successfully!" })
      router.refresh()
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {message && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar
                src={profile?.avatar_url}
                alt={name || "User"}
                size="lg"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Profile Photo</p>
                <p className="text-xs text-gray-500">
                  Avatar support coming soon
                </p>
              </div>
            </div>

            {/* Name */}
            <Input
              label="Display Name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {/* Email (read-only) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600">
                <Mail className="h-4 w-4" />
                {profile?.email}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Public profile */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make my profile public (visible to other travelers)
              </label>
            </div>

            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="font-medium text-gray-900">Sign out</p>
              <p className="text-sm text-gray-600">
                Sign out of your account on this device
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
            <div>
              <p className="font-medium text-red-900">Delete Account</p>
              <p className="text-sm text-red-700">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-100"
              disabled
            >
              Delete (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
