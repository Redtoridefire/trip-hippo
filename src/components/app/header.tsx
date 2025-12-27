"use client"

import { useRouter } from "next/navigation"
import { LogOut, Menu, User, PlaneTakeoff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  user: {
    id: string
    email: string
    name: string
    avatar_url: string | null
  }
}

export function AppHeader({ user }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Mobile menu button + logo */}
      <div className="flex items-center gap-4 lg:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <PlaneTakeoff className="h-5 w-5 text-blue-600" />
          <span className="font-bold text-gray-900">TripHippo</span>
        </div>
      </div>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <Avatar
              src={user.avatar_url}
              alt={user.name}
              size="sm"
            />
            <span className="hidden sm:inline-block">{user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} destructive>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
