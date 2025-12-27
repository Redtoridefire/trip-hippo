import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const SYSTEM_PROMPT = `You are a helpful travel planning assistant for TripHippo, a travel planning app. You help users plan their trips by:

1. Suggesting places to visit based on their destination
2. Creating day-by-day itineraries
3. Recommending restaurants, activities, and attractions
4. Providing travel tips and local insights
5. Helping optimize routes and schedules
6. Answering questions about destinations

Be friendly, concise, and practical in your responses. Use markdown formatting for better readability:
- Use **bold** for place names and important terms
- Use bullet points for lists
- Use ### for section headers when organizing longer responses

When suggesting specific places to visit, restaurants, or attractions, format each suggestion like this:
**Place Name** - Brief description of why it's worth visiting.

If asked about a specific trip, use the context provided about the trip's destination, dates, and existing itinerary items.`

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { messages, tripId } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      )
    }

    // Get trip context if tripId is provided
    let tripContext = ""
    if (tripId) {
      const { data: trip } = await supabase
        .from("trips")
        .select(`
          name,
          home_base,
          start_date,
          end_date,
          itinerary_items(title, notes, day_id)
        `)
        .eq("id", tripId)
        .single()

      if (trip) {
        tripContext = `\n\nCurrent trip context:
- Trip name: ${trip.name}
- Destination: ${trip.home_base || "Not specified"}
- Dates: ${trip.start_date || "Not set"} to ${trip.end_date || "Not set"}
- Existing items: ${trip.itinerary_items?.length || 0} places added`
      }
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + tripContext },
          ...messages,
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("OpenAI API error:", error)
      return NextResponse.json(
        { error: "Failed to get AI response" },
        { status: 500 }
      )
    }

    const data = await response.json()
    const assistantMessage = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response."

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
