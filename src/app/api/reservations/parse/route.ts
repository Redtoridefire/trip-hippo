import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const PARSE_PROMPT = `You are a travel reservation parser. Extract reservation details from the following email or text content.

Return a JSON object with these fields:
- type: one of "flight", "lodging", "car", "rail", "event", "other"
- provider: the company name (airline, hotel chain, rental company, etc.)
- confirmation: the confirmation/booking number
- title: a brief title for the reservation
- start_dt: ISO 8601 datetime string for start/check-in/departure (or null if not found)
- end_dt: ISO 8601 datetime string for end/check-out/arrival (or null if not found)
- metadata: object with additional relevant details like:
  - For flights: departure_airport, arrival_airport, flight_number, seat, terminal, gate
  - For lodging: hotel_name, address, room_type, number_of_nights
  - For cars: pickup_location, dropoff_location, car_type
  - For rail: departure_station, arrival_station, train_number, seat
  - For events: venue, address, seat_section

If you cannot determine a field, set it to null. Do your best to infer missing information from context.

Return ONLY valid JSON, no markdown or explanations.`

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API not configured" },
      { status: 500 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { content, tripId } = await request.json()

    if (!content || !tripId) {
      return NextResponse.json(
        { error: "Content and tripId are required" },
        { status: 400 }
      )
    }

    // Parse with OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: PARSE_PROMPT },
          { role: "user", content: content.slice(0, 10000) }, // Limit content length
        ],
        max_tokens: 1000,
        temperature: 0.1, // Low temperature for consistent parsing
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to parse reservation")
    }

    const data = await response.json()
    const parsed = JSON.parse(data.choices[0].message.content)

    // Validate the parsed data
    const validTypes = ["flight", "lodging", "car", "rail", "event", "other"]
    if (!validTypes.includes(parsed.type)) {
      parsed.type = "other"
    }

    return NextResponse.json({
      reservation: {
        trip_id: tripId,
        type: parsed.type,
        provider: parsed.provider,
        confirmation: parsed.confirmation,
        title: parsed.title,
        start_dt: parsed.start_dt,
        end_dt: parsed.end_dt,
        metadata: parsed.metadata || {},
        source: "email_import",
      },
    })
  } catch (error) {
    console.error("Reservation parse error:", error)
    return NextResponse.json(
      { error: "Failed to parse reservation" },
      { status: 500 }
    )
  }
}
