"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CreateTripModal } from "./create-trip-modal"

interface CreateTripButtonProps {
  variant?: "default" | "outline"
}

export function CreateTripButton({ variant = "default" }: CreateTripButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant={variant}>
        <Plus className="mr-2 h-4 w-4" />
        New Trip
      </Button>

      <CreateTripModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
