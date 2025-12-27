import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  MapPin,
  Heart,
  Eye,
  ArrowLeft,
  Calendar,
  User,
  Share2,
  PlaneTakeoff,
  Clock,
  ExternalLink,
} from "lucide-react"
import type { Guide, GuideBlock, Place } from "@/types"

interface PageProps {
  params: Promise<{ id: string }>
}

interface RelatedGuide {
  id: string
  title: string
  cover_image: string | null
  destination_slug: string | null
  likes_count: number
}

async function getGuide(id: string) {
  const supabase = await createClient()

  const { data: guide, error } = await supabase
    .from("guides")
    .select("*, author:profiles(*)")
    .eq("id", id)
    .single()

  if (error || !guide) return null

  // Increment view count
  await supabase
    .from("guides")
    .update({ views_count: (guide.views_count || 0) + 1 })
    .eq("id", id)

  return guide as Guide
}

async function getGuidePlaces(guideBody: GuideBlock[]) {
  const placeIds = guideBody
    .filter((block) => block.type === "place" && block.place_id)
    .map((block) => block.place_id!)

  if (placeIds.length === 0) return []

  const supabase = await createClient()
  const { data: places } = await supabase
    .from("places")
    .select("*")
    .in("id", placeIds)

  return (places || []) as Place[]
}

async function getRelatedGuides(guide: Guide): Promise<RelatedGuide[]> {
  const supabase = await createClient()

  const { data: related } = await supabase
    .from("guides")
    .select("id, title, cover_image, destination_slug, likes_count")
    .eq("is_published", true)
    .neq("id", guide.id)
    .limit(3)

  return (related || []) as RelatedGuide[]
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function hasUserLiked(guideId: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("likes")
    .select("user_id")
    .eq("entity_type", "guide")
    .eq("entity_id", guideId)
    .eq("user_id", userId)
    .single()

  return !!data
}

export default async function GuidePage({ params }: PageProps) {
  const { id } = await params
  const guide = await getGuide(id)

  if (!guide) {
    notFound()
  }

  const [user, places, relatedGuides] = await Promise.all([
    getUser(),
    getGuidePlaces(guide.body || []),
    getRelatedGuides(guide),
  ])

  const userLiked = user ? await hasUserLiked(guide.id, user.id) : false
  const placesMap = new Map(places.map((p) => [p.id, p]))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      {!user && (
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2">
              <PlaneTakeoff className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">TripHippo</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Log in
              </Link>
              <Link href="/signup">
                <Button>Get Started Free</Button>
              </Link>
            </div>
          </div>
        </nav>
      )}

      {/* Cover image */}
      <div className="relative h-64 bg-gradient-to-br from-blue-400 to-purple-500 sm:h-80 lg:h-96">
        {guide.cover_image && (
          <img
            src={guide.cover_image}
            alt={guide.title}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Back button */}
        <Link
          href="/guides"
          className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-700 backdrop-blur hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Guides
        </Link>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">
            {guide.destination_slug && (
              <Badge className="mb-2 bg-white/90 text-gray-900">
                <MapPin className="mr-1 h-3 w-3" />
                {guide.destination_slug}
              </Badge>
            )}
            <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              {guide.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Author and stats bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-4">
            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {(guide.author as any)?.name || "Anonymous"}
                </p>
                <p className="text-xs text-gray-500">
                  <Calendar className="mr-1 inline h-3 w-3" />
                  {new Date(guide.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Stats and actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {guide.views_count} views
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {guide.likes_count} likes
              </span>
            </div>

            <LikeButton guideId={guide.id} initialLiked={userLiked} isLoggedIn={!!user} />

            <Button variant="outline" size="sm">
              <Share2 className="mr-1.5 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Excerpt */}
        {guide.excerpt && (
          <p className="mb-8 text-lg text-gray-600 leading-relaxed">
            {guide.excerpt}
          </p>
        )}

        {/* Body content */}
        <div className="prose prose-gray max-w-none">
          {(guide.body || []).map((block, index) => (
            <GuideBlockRenderer
              key={index}
              block={block}
              place={block.place_id ? placesMap.get(block.place_id) : undefined}
            />
          ))}
        </div>

        {/* Places mentioned */}
        {places.length > 0 && (
          <div className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Places in this Guide
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {places.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </div>
        )}

        {/* Related guides */}
        {relatedGuides.length > 0 && (
          <div className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              More Travel Guides
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedGuides.map((related) => (
                <Link
                  key={related.id}
                  href={`/guides/${related.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500">
                      {related.cover_image && (
                        <img
                          src={related.cover_image}
                          alt={related.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                        {related.title}
                      </h3>
                      {related.destination_slug && (
                        <p className="mt-1 text-xs text-gray-500">
                          <MapPin className="mr-1 inline h-3 w-3" />
                          {related.destination_slug}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA for non-logged in users */}
        {!user && (
          <div className="mt-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-center text-white">
            <h2 className="text-2xl font-bold">Ready to plan your trip?</h2>
            <p className="mt-2 text-blue-100">
              Create your own itinerary and share your experiences with the community.
            </p>
            <Link href="/signup">
              <Button size="lg" className="mt-4 bg-white text-blue-600 hover:bg-blue-50">
                Get Started Free
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Client component for like button
function LikeButton({
  guideId,
  initialLiked,
  isLoggedIn,
}: {
  guideId: string
  initialLiked: boolean
  isLoggedIn: boolean
}) {
  return (
    <form action={`/api/guides/${guideId}/like`} method="POST">
      <Button
        type="submit"
        variant={initialLiked ? "default" : "outline"}
        size="sm"
        disabled={!isLoggedIn}
        title={isLoggedIn ? (initialLiked ? "Unlike" : "Like") : "Log in to like"}
      >
        <Heart className={`mr-1.5 h-4 w-4 ${initialLiked ? "fill-current" : ""}`} />
        {initialLiked ? "Liked" : "Like"}
      </Button>
    </form>
  )
}

function GuideBlockRenderer({ block, place }: { block: GuideBlock; place?: Place }) {
  switch (block.type) {
    case "heading":
      return (
        <h2 className="mt-8 mb-4 text-2xl font-bold text-gray-900">
          {block.content}
        </h2>
      )

    case "text":
      return (
        <p className="mb-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
          {block.content}
        </p>
      )

    case "image":
      return (
        <figure className="my-6">
          <img
            src={block.image_url}
            alt={block.caption || "Guide image"}
            className="w-full rounded-lg"
          />
          {block.caption && (
            <figcaption className="mt-2 text-center text-sm text-gray-500">
              {block.caption}
            </figcaption>
          )}
        </figure>
      )

    case "place":
      if (!place) {
        return (
          <div className="my-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-gray-500">Place not found</p>
          </div>
        )
      }
      return <PlaceCard place={place} className="my-4" />

    default:
      return null
  }
}

function PlaceCard({ place, className = "" }: { place: Place; className?: string }) {
  const googleMapsUrl = place.lat && place.lng
    ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
    : place.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
    : null

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{place.name}</h3>
            {place.address && (
              <p className="mt-0.5 text-sm text-gray-500 truncate">
                {place.address}
              </p>
            )}
            {place.categories && place.categories.length > 0 && (
              <Badge variant="secondary" className="mt-2">
                {place.categories[0]}
              </Badge>
            )}
          </div>
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Open in Google Maps"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
