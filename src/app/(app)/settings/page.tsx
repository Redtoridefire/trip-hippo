"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Mail, Camera, Loader2, Upload, Trash2, AlertTriangle, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { theme, setTheme } = useTheme()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)

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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: "error", text: "Please upload an image file" })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be less than 2MB" })
      return
    }

    setUploadingAvatar(true)
    setMessage(null)

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        // If bucket doesn't exist, show friendly message
        if (uploadError.message.includes('bucket')) {
          setMessage({ type: "error", text: "Avatar storage not configured. Please contact support." })
        } else {
          setMessage({ type: "error", text: uploadError.message })
        }
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) {
        setMessage({ type: "error", text: updateError.message })
        return
      }

      setProfile({ ...profile, avatar_url: publicUrl })
      setMessage({ type: "success", text: "Avatar updated successfully!" })
    } catch (err) {
      setMessage({ type: "error", text: "Failed to upload avatar" })
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE" || !profile) return

    setDeleting(true)

    try {
      // Delete user's trips (this will cascade delete related items)
      await supabase
        .from('trips')
        .delete()
        .eq('owner_id', profile.id)

      // Delete user's profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id)

      // Sign out and redirect
      await supabase.auth.signOut()
      router.push("/?deleted=true")
    } catch (err) {
      setMessage({ type: "error", text: "Failed to delete account. Please try again." })
      setDeleting(false)
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
              <div className="relative">
                <Avatar
                  src={profile?.avatar_url}
                  alt={name || "User"}
                  size="lg"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 rounded-full bg-blue-600 p-1.5 text-white shadow-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Profile Photo</p>
                <p className="text-xs text-gray-500">
                  Click the camera icon to upload a new photo
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Appearance Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Theme
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-1 flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                  theme === "light"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                <Sun className={`h-6 w-6 ${theme === "light" ? "text-blue-600" : "text-gray-500"}`} />
                <span className={`text-sm font-medium ${theme === "light" ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                  Light
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-1 flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                  theme === "dark"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                <Moon className={`h-6 w-6 ${theme === "dark" ? "text-blue-600" : "text-gray-500"}`} />
                <span className={`text-sm font-medium ${theme === "dark" ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                  Dark
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-1 flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                  theme === "system"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
              >
                <Monitor className={`h-6 w-6 ${theme === "system" ? "text-blue-600" : "text-gray-500"}`} />
                <span className={`text-sm font-medium ${theme === "system" ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                  System
                </span>
              </button>
            </div>
          </div>
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
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Delete Account</h2>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium mb-2">This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your profile and account</li>
                <li>All your trips and itineraries</li>
                <li>All reservations, expenses, and checklists</li>
                <li>Any guides you've created</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText("")
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={deleteConfirmText !== "DELETE"}
                loading={deleting}
                onClick={handleDeleteAccount}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
