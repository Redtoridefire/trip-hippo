"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface PresenceUser {
  id: string
  name: string
  avatarUrl?: string
  color: string
  lastSeen: number
}

interface PresenceState {
  [key: string]: PresenceUser[]
}

// Colors for different users
const PRESENCE_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
]

function getColorForUser(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash = hash & hash
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length]
}

export function useRealtimePresence(tripId: string, currentUser: { id: string; name: string; avatarUrl?: string } | null) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  const handlePresenceSync = useCallback(() => {
    if (!channelRef.current) return

    const state = channelRef.current.presenceState() as PresenceState
    const users: PresenceUser[] = []

    Object.values(state).forEach((presences) => {
      presences.forEach((presence) => {
        // Don't include current user in the list
        if (currentUser && presence.id !== currentUser.id) {
          users.push(presence)
        }
      })
    })

    setOnlineUsers(users)
  }, [currentUser])

  useEffect(() => {
    if (!tripId || !currentUser) return

    const channel = supabase.channel(`presence:trip:${tripId}`, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    })

    channel
      .on("presence", { event: "sync" }, handlePresenceSync)
      .on("presence", { event: "join" }, handlePresenceSync)
      .on("presence", { event: "leave" }, handlePresenceSync)
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: currentUser.id,
            name: currentUser.name,
            avatarUrl: currentUser.avatarUrl,
            color: getColorForUser(currentUser.id),
            lastSeen: Date.now(),
          })
        }
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [tripId, currentUser, supabase, handlePresenceSync])

  return onlineUsers
}
