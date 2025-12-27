import { createClient } from "@/lib/supabase/server"
import { ChecklistView } from "@/components/trip/checklist/checklist-view"
import type { ChecklistItem } from "@/types"

async function getChecklists(tripId: string) {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true })

  return (items || []) as ChecklistItem[]
}

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const items = await getChecklists(tripId)

  return <ChecklistView tripId={tripId} items={items} />
}
