import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/app/sidebar"
import { AppHeader } from "@/components/app/header"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const userProfile = {
    id: user.id,
    email: user.email!,
    name: profile?.name || user.email!.split("@")[0],
    avatar_url: profile?.avatar_url || null,
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AppSidebar user={userProfile} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={userProfile} />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}
