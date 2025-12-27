"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Type,
  Heading,
  Image,
  MapPin,
  Save,
  Eye,
  Send,
} from "lucide-react"
import type { GuideBlock } from "@/types"

export default function NewGuidePage() {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [destination, setDestination] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [blocks, setBlocks] = useState<GuideBlock[]>([
    { type: "text", content: "" }
  ])
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  async function handleSave(publish: boolean = false) {
    if (!title.trim()) {
      alert("Please enter a title")
      return
    }

    const action = publish ? setPublishing : setSaving
    action(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    const guideData = {
      author_id: user.id,
      title: title.trim(),
      excerpt: excerpt.trim() || null,
      destination_slug: destination.trim() || null,
      cover_image: coverImage.trim() || null,
      body: blocks.filter(b => b.content?.trim() || b.image_url),
      is_published: publish,
    }

    const { data, error } = await supabase
      .from("guides")
      .insert(guideData)
      .select()
      .single()

    action(false)

    if (error) {
      console.error("Error saving guide:", error)
      alert("Failed to save guide")
      return
    }

    if (publish) {
      router.push(`/guides/${data.id}`)
    } else {
      router.push(`/guides/${data.id}/edit`)
    }
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

  function moveBlock(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === blocks.length - 1) return

    const newBlocks = [...blocks]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]
    setBlocks(newBlocks)
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving || publishing}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={saving || publishing}
            >
              <Send className="mr-1.5 h-4 w-4" />
              {publishing ? "Publishing..." : "Publish"}
            </Button>
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
                {/* Block controls */}
                <div className="absolute -left-12 top-1/2 hidden -translate-y-1/2 flex-col gap-1 group-hover:flex">
                  <button
                    onClick={() => moveBlock(index, "up")}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    disabled={index === 0}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </div>

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => addBlock("text")}
          >
            <Type className="mr-1.5 h-4 w-4" />
            Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addBlock("heading")}
          >
            <Heading className="mr-1.5 h-4 w-4" />
            Heading
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addBlock("image")}
          >
            <Image className="mr-1.5 h-4 w-4" />
            Image
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addBlock("place")}
          >
            <MapPin className="mr-1.5 h-4 w-4" />
            Place
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
            placeholder="Search for a place or enter place ID..."
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
