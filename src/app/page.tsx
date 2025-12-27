import Link from "next/link"
import {
  Map,
  Calendar,
  Users,
  Plane,
  DollarSign,
  CheckSquare,
  Route,
  Sparkles,
  Download,
  Globe,
  PlaneTakeoff,
  ArrowRight,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Calendar,
    title: "Day-by-Day Itinerary",
    description:
      "Plan each day with activities, times, and notes. Drag and drop to reorganize your schedule.",
  },
  {
    icon: Map,
    title: "Interactive Map View",
    description:
      "See all your places on a map with routes between stops. Filter by day or category.",
  },
  {
    icon: Route,
    title: "Route Optimization",
    description:
      "Automatically optimize your daily route to save time and see more. One click to reorder.",
  },
  {
    icon: Users,
    title: "Real-Time Collaboration",
    description:
      "Plan together with friends and family. Everyone can add places and edit the itinerary.",
  },
  {
    icon: Plane,
    title: "Reservations Hub",
    description:
      "Keep all your flights, hotels, and bookings in one place. Import from email or add manually.",
  },
  {
    icon: DollarSign,
    title: "Budget & Expense Tracking",
    description:
      "Set a budget, track expenses, and split costs with travel companions. Know who owes what.",
  },
  {
    icon: CheckSquare,
    title: "Packing Lists",
    description:
      "Never forget essentials with customizable checklists. Assign items to specific travelers.",
  },
  {
    icon: Sparkles,
    title: "AI Trip Assistant",
    description:
      "Get personalized recommendations and let AI help build your perfect itinerary.",
  },
  {
    icon: Download,
    title: "Offline Access",
    description:
      "Download your trip for offline access. View your plans anywhere, even without internet.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
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

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Plan your perfect trip,{" "}
              <span className="text-blue-600">together</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              The all-in-one travel planner that helps you organize your
              itinerary, track reservations, collaborate with friends, and make
              the most of every adventure.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start Planning Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/guides">
                <Button variant="outline" size="lg" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                  Explore Guides
                </Button>
              </Link>
            </div>
          </div>

          {/* App preview */}
          <div className="mt-16 sm:mt-24">
            <div className="relative mx-auto max-w-5xl">
              <div className="rounded-2xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10">
                <div className="rounded-xl bg-white shadow-2xl ring-1 ring-gray-900/10">
                  <div className="flex h-8 items-center gap-2 border-b border-gray-200 px-4">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="aspect-[16/9] bg-gradient-to-br from-blue-100 via-white to-purple-100 p-8">
                    <div className="flex h-full gap-4">
                      {/* Sidebar mock */}
                      <div className="w-48 rounded-lg bg-white/80 p-4 shadow-sm">
                        <div className="h-4 w-24 rounded bg-gray-200" />
                        <div className="mt-4 space-y-2">
                          <div className="h-3 w-full rounded bg-blue-200" />
                          <div className="h-3 w-3/4 rounded bg-gray-200" />
                          <div className="h-3 w-5/6 rounded bg-gray-200" />
                        </div>
                      </div>
                      {/* Main content mock */}
                      <div className="flex-1 rounded-lg bg-white/80 p-4 shadow-sm">
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="h-6 w-32 rounded bg-gray-200" />
                            <div className="rounded-lg border border-gray-200 p-3">
                              <div className="h-3 w-24 rounded bg-blue-200" />
                              <div className="mt-2 h-2 w-full rounded bg-gray-100" />
                            </div>
                            <div className="rounded-lg border border-gray-200 p-3">
                              <div className="h-3 w-28 rounded bg-green-200" />
                              <div className="mt-2 h-2 w-3/4 rounded bg-gray-100" />
                            </div>
                          </div>
                          <div className="w-64 rounded-lg bg-blue-50 p-3">
                            <div className="h-full rounded bg-blue-100" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to plan amazing trips
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From itineraries to budgets, we&apos;ve got you covered
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="relative rounded-2xl border border-gray-200 p-6 transition-shadow hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-gray-200 bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">1M+</p>
              <p className="text-sm text-gray-600">Trips planned</p>
            </div>
            <div className="h-12 w-px bg-gray-300" />
            <div>
              <p className="text-3xl font-bold text-gray-900">500K+</p>
              <p className="text-sm text-gray-600">Happy travelers</p>
            </div>
            <div className="h-12 w-px bg-gray-300" />
            <div>
              <p className="text-3xl font-bold text-gray-900">195</p>
              <p className="text-sm text-gray-600">Countries covered</p>
            </div>
            <div className="h-12 w-px bg-gray-300" />
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <p className="text-3xl font-bold text-gray-900">4.9</p>
              <p className="ml-2 text-sm text-gray-600">App Store rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-blue-600 px-6 py-16 text-center sm:px-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to plan your next adventure?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
              Join millions of travelers who use TripHippo to plan unforgettable
              trips. It&apos;s free to get started.
            </p>
            <div className="mt-8">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <PlaneTakeoff className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">TripHippo</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <Link href="/guides" className="hover:text-gray-900">
                Travel Guides
              </Link>
              <Link href="/blog" className="hover:text-gray-900">
                Blog
              </Link>
              <Link href="/help" className="hover:text-gray-900">
                Help Center
              </Link>
              <Link href="/terms" className="hover:text-gray-900">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-gray-900">
                Privacy
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} TripHippo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
