import { createClient } from "@/lib/supabase/server"
import { BudgetView } from "@/components/trip/budget/budget-view"
import type { Expense, Budget, TripMember } from "@/types"

async function getBudgetData(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get budget
  const { data: budget } = await supabase
    .from("budgets")
    .select("*")
    .eq("trip_id", tripId)
    .single()

  // Get expenses with splits
  const { data: expenses } = await supabase
    .from("expenses")
    .select(`
      *,
      splits:expense_splits(*)
    `)
    .eq("trip_id", tripId)
    .order("occurred_at", { ascending: false })

  // Get trip members for splitting
  const { data: members } = await supabase
    .from("trip_members")
    .select("*, user:profiles(*)")
    .eq("trip_id", tripId)
    .not("accepted_at", "is", null)

  // Get trip owner
  const { data: trip } = await supabase
    .from("trips")
    .select("owner_id")
    .eq("id", tripId)
    .single()

  return {
    budget: budget as Budget | null,
    expenses: (expenses || []) as Expense[],
    members: (members || []) as TripMember[],
    tripOwnerId: trip?.owner_id,
    currentUserId: user?.id,
  }
}

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const { budget, expenses, members, tripOwnerId, currentUserId } = await getBudgetData(tripId)

  return (
    <BudgetView
      tripId={tripId}
      budget={budget}
      expenses={expenses}
      members={members}
      tripOwnerId={tripOwnerId}
      currentUserId={currentUserId}
    />
  )
}
