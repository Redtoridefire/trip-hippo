"use client"

import { useRealtimePresence } from "@/hooks/use-realtime-presence"
import { User } from "lucide-react"

interface OnlineUsersProps {
  tripId: string
  currentUser: { id: string; name: string; avatarUrl?: string } | null
}

export function OnlineUsers({ tripId, currentUser }: OnlineUsersProps) {
  const onlineUsers = useRealtimePresence(tripId, currentUser)

  if (onlineUsers.length === 0) return null

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-500 mr-1">Online:</span>
      <div className="flex -space-x-2">
        {onlineUsers.slice(0, 5).map((user) => (
          <div
            key={user.id}
            className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-medium text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
            {/* Online indicator dot */}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
          </div>
        ))}
        {onlineUsers.length > 5 && (
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-200"
            title={`${onlineUsers.length - 5} more online`}
          >
            <span className="text-xs font-medium text-gray-600">
              +{onlineUsers.length - 5}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Smaller inline version for tight spaces
export function OnlineIndicator({ tripId, currentUser }: OnlineUsersProps) {
  const onlineUsers = useRealtimePresence(tripId, currentUser)

  if (onlineUsers.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <span className="flex h-2 w-2 rounded-full bg-green-500" />
      <span>{onlineUsers.length} online</span>
    </div>
  )
}
