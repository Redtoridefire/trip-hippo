import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Heart, Eye, ArrowLeft } from "lucide-react"
import type { Guide } from "@/types"

async function getGuides() {
  const supabase = await createClient()

  const { data: guides } = await supabase
    .from("guides")
    .select("*, author:profiles(*)")
    .eq("is_published", true)
    .order("views_count", { ascending: false })
    .limit(20)

  return (guides || []) as Guide[]
}

export default async function GuidesPage() {
  const guides = await getGuides()

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Travel Guides</h1>
        <p className="mt-1 text-gray-600">
          Discover curated itineraries and travel tips from the community
        </p>
      </div>

      {/* Guides grid */}
      {guides.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link href={`/guides/${guide.id}`}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
        {/* Cover image */}
        <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500">
          {guide.cover_image && (
            <img
              src={guide.cover_image}
              alt={guide.title}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <CardContent className="p-4">
          {/* Destination badge */}
          {guide.destination_slug && (
            <Badge variant="secondary" className="mb-2">
              <MapPin className="mr-1 h-3 w-3" />
              {guide.destination_slug}
            </Badge>
          )}

          {/* Title */}
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
            {guide.title}
          </h3>

          {/* Excerpt */}
          {guide.excerpt && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
              {guide.excerpt}
            </p>
          )}

          {/* Stats */}
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {guide.likes_count}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {guide.views_count}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-12 text-center">
      <MapPin className="mx-auto h-12 w-12 text-gray-400" />
      <h2 className="mt-4 text-lg font-semibold text-gray-900">
        No guides yet
      </h2>
      <p className="mt-2 text-gray-600">
        Be the first to share your travel experiences and tips with the
        community.
      </p>
    </div>
  )
}
