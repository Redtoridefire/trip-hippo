import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: guideId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Check if already liked (using generic likes table)
  const { data: existing } = await supabase
    .from("likes")
    .select("user_id")
    .eq("entity_type", "guide")
    .eq("entity_id", guideId)
    .eq("user_id", user.id)
    .single()

  if (existing) {
    // Unlike - remove the like
    await supabase
      .from("likes")
      .delete()
      .eq("entity_type", "guide")
      .eq("entity_id", guideId)
      .eq("user_id", user.id)

    // Decrement count
    await supabase
      .from("guides")
      .update({ likes_count: Math.max(0, await getGuidelikesCount(supabase, guideId) - 1) })
      .eq("id", guideId)
  } else {
    // Like - add the like
    await supabase
      .from("likes")
      .insert({
        user_id: user.id,
        entity_type: "guide",
        entity_id: guideId,
      })

    // Increment count
    await supabase
      .from("guides")
      .update({ likes_count: await getGuidelikesCount(supabase, guideId) + 1 })
      .eq("id", guideId)
  }

  // Redirect back to the guide page
  return NextResponse.redirect(new URL(`/guides/${guideId}`, request.url))
}

async function getGuidelikesCount(supabase: any, guideId: string): Promise<number> {
  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("entity_type", "guide")
    .eq("entity_id", guideId)

  return count || 0
}
