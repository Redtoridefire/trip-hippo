"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Trash2,
  GripVertical,
  Type,
  Heading,
  Image,
  MapPin,
  Save,
  Send,
  Loader2,
  Eye,
} from "lucide-react"
import type { GuideBlock, Guide } from "@/types"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditGuidePage({ params }: PageProps) {
  const router = useRouter()
  const supabase = createClient()

  const [guideId, setGuideId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [destination, setDestination] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [blocks, setBlocks] = useState<GuideBlock[]>([])
  const [isPublished, setIsPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    async function loadGuide() {
      const { id } = await params
      setGuideId(id)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: guide, error } = await supabase
        .from("guides")
        .select("*")
        .eq("id", id)
        .single()

      if (error || !guide) {
        router.push("/guides")
        return
      }

      // Check ownership
      if (guide.author_id !== user.id) {
        router.push(`/guides/${id}`)
        return
      }

      setTitle(guide.title)
      setExcerpt(guide.excerpt || "")
      setDestination(guide.destination_slug || "")
      setCoverImage(guide.cover_image || "")
      setBlocks(guide.body || [{ type: "text", content: "" }])
      setIsPublished(guide.is_published)
      setLoading(false)
    }

    loadGuide()
  }, [params, supabase, router])

  async function handleSave(publish?: boolean) {
    if (!title.trim()) {
      alert("Please enter a title")
      return
    }

    const action = publish !== undefined ? setPublishing : setSaving
    action(true)

    const guideData = {
      title: title.trim(),
      excerpt: excerpt.trim() || null,
      destination_slug: destination.trim() || null,
      cover_image: coverImage.trim() || null,
      body: blocks.filter(b => b.content?.trim() || b.image_url),
      is_published: publish !== undefined ? publish : isPublished,
    }

    const { error } = await supabase
      .from("guides")
      .update(guideData)
      .eq("id", guideId)

    action(false)

    if (error) {
      console.error("Error saving guide:", error)
      alert("Failed to save guide")
      return
    }

    if (publish) {
      router.push(`/guides/${guideId}`)
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this guide? This cannot be undone.")) {
      return
    }

    const { error } = await supabase
      .from("guides")
      .delete()
      .eq("id", guideId)

    if (error) {
      console.error("Error deleting guide:", error)
      alert("Failed to delete guide")
      return
    }

    router.push("/guides")
  }

  function addBlock(type: GuideBlock["type"]) {
    setBlocks([...blocks, { type, content: "" }])
  }

  function updateBlock(index: number, updates: Partial<GuideBlock>) {
    const newBlocks = [...blocks]
    newBlocks[index] = { ...newBlocks[index], ...updates }
    setBlocks(newBlocks)
  }

  function removeBlock(index: number) {
    if (blocks.length <= 1) return
    setBlocks(blocks.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link
            href="/guides"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Guides
          </Link>

          <div className="flex items-center gap-2">
            <Link href={`/guides/${guideId}`}>
              <Button variant="ghost" size="sm">
                <Eye className="mr-1.5 h-4 w-4" />
                Preview
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave()}
              disabled={saving || publishing}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
            {!isPublished ? (
              <Button
                size="sm"
                onClick={() => handleSave(true)}
                disabled={saving || publishing}
              >
                <Send className="mr-1.5 h-4 w-4" />
                {publishing ? "Publishing..." : "Publish"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={saving || publishing}
              >
                Unpublish
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Cover Image */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Cover Image URL
          </label>
          <Input
            placeholder="https://example.com/image.jpg"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
          />
          {coverImage && (
            <div className="mt-2 aspect-video overflow-hidden rounded-lg bg-gray-100">
              <img
                src={coverImage}
                alt="Cover preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Guide title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-none bg-transparent text-3xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        {/* Destination */}
        <div className="mb-4">
          <Input
            placeholder="Destination (e.g., Paris, France)"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        {/* Excerpt */}
        <div className="mb-8">
          <textarea
            placeholder="Write a short excerpt or summary..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content blocks */}
        <div className="space-y-4">
          {blocks.map((block, index) => (
            <Card key={index} className="group relative">
              <CardContent className="p-4">
                <div className="absolute -right-12 top-2 hidden group-hover:block">
                  <button
                    onClick={() => removeBlock(index)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    disabled={blocks.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <BlockEditor
                  block={block}
                  onChange={(updates) => updateBlock(index, updates)}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add block buttons */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => addBlock("text")}>
            <Type className="mr-1.5 h-4 w-4" />
            Text
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("heading")}>
            <Heading className="mr-1.5 h-4 w-4" />
            Heading
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("image")}>
            <Image className="mr-1.5 h-4 w-4" />
            Image
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("place")}>
            <MapPin className="mr-1.5 h-4 w-4" />
            Place
          </Button>
        </div>

        {/* Delete button */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h3 className="text-lg font-semibold text-gray-900">Danger Zone</h3>
          <p className="mt-1 text-sm text-gray-600">
            Permanently delete this guide. This action cannot be undone.
          </p>
          <Button
            variant="outline"
            className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete Guide
          </Button>
        </div>
      </div>
    </div>
  )
}

function BlockEditor({
  block,
  onChange,
}: {
  block: GuideBlock
  onChange: (updates: Partial<GuideBlock>) => void
}) {
  switch (block.type) {
    case "heading":
      return (
        <input
          type="text"
          placeholder="Section heading..."
          value={block.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
          className="w-full border-none bg-transparent text-xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      )

    case "text":
      return (
        <textarea
          placeholder="Write your content here..."
          value={block.content || ""}
          onChange={(e) => onChange({ content: e.target.value })}
          rows={4}
          className="w-full resize-none border-none bg-transparent text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
      )

    case "image":
      return (
        <div className="space-y-2">
          <Input
            placeholder="Image URL..."
            value={block.image_url || ""}
            onChange={(e) => onChange({ image_url: e.target.value })}
          />
          <Input
            placeholder="Caption (optional)"
            value={block.caption || ""}
            onChange={(e) => onChange({ caption: e.target.value })}
          />
          {block.image_url && (
            <img
              src={block.image_url}
              alt={block.caption || "Preview"}
              className="max-h-64 rounded-lg object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none"
              }}
            />
          )}
        </div>
      )

    case "place":
      return (
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
          <MapPin className="h-5 w-5 text-blue-600" />
          <Input
            placeholder="Place ID..."
            value={block.place_id || ""}
            onChange={(e) => onChange({ place_id: e.target.value })}
            className="border-blue-200"
          />
        </div>
      )

    default:
      return null
  }
}
