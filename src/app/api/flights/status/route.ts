import { NextRequest, NextResponse } from "next/server"

// AviationStack API (free tier available) or FlightAware
const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY

interface FlightStatus {
  flightNumber: string
  airline: string
  status: "scheduled" | "active" | "landed" | "cancelled" | "delayed" | "unknown"
  departure: {
    airport: string
    iata: string
    scheduled: string
    estimated?: string
    actual?: string
    terminal?: string
    gate?: string
  }
  arrival: {
    airport: string
    iata: string
    scheduled: string
    estimated?: string
    actual?: string
    terminal?: string
    gate?: string
  }
  delay?: number // in minutes
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const flightNumber = searchParams.get("flight")

  if (!flightNumber) {
    return NextResponse.json(
      { error: "Flight number required" },
      { status: 400 }
    )
  }

  // If no API key, return mock data for development
  if (!AVIATIONSTACK_API_KEY) {
    return NextResponse.json(getMockFlightStatus(flightNumber))
  }

  try {
    // Parse flight number (e.g., "UA123" -> airline: "UA", flight: "123")
    const match = flightNumber.match(/^([A-Z]{2})(\d+)$/i)
    if (!match) {
      return NextResponse.json(
        { error: "Invalid flight number format. Use format like UA123" },
        { status: 400 }
      )
    }

    const [, airlineCode, flightNum] = match

    const url = `http://api.aviationstack.com/v1/flights?access_key=${AVIATIONSTACK_API_KEY}&flight_iata=${flightNumber.toUpperCase()}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || "Failed to fetch flight data" },
        { status: 500 }
      )
    }

    if (!data.data || data.data.length === 0) {
      return NextResponse.json(
        { error: "Flight not found" },
        { status: 404 }
      )
    }

    const flight = data.data[0]

    const result: FlightStatus = {
      flightNumber: flight.flight.iata,
      airline: flight.airline.name,
      status: mapFlightStatus(flight.flight_status),
      departure: {
        airport: flight.departure.airport,
        iata: flight.departure.iata,
        scheduled: flight.departure.scheduled,
        estimated: flight.departure.estimated,
        actual: flight.departure.actual,
        terminal: flight.departure.terminal,
        gate: flight.departure.gate,
      },
      arrival: {
        airport: flight.arrival.airport,
        iata: flight.arrival.iata,
        scheduled: flight.arrival.scheduled,
        estimated: flight.arrival.estimated,
        actual: flight.arrival.actual,
        terminal: flight.arrival.terminal,
        gate: flight.arrival.gate,
      },
      delay: flight.departure.delay || flight.arrival.delay,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Flight API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch flight data" },
      { status: 500 }
    )
  }
}

function mapFlightStatus(status: string): FlightStatus["status"] {
  const statusMap: Record<string, FlightStatus["status"]> = {
    scheduled: "scheduled",
    active: "active",
    landed: "landed",
    cancelled: "cancelled",
    incident: "cancelled",
    diverted: "delayed",
  }
  return statusMap[status] || "unknown"
}

function getMockFlightStatus(flightNumber: string): FlightStatus {
  const now = new Date()
  const departureTime = new Date(now.getTime() + 3 * 60 * 60 * 1000) // 3 hours from now
  const arrivalTime = new Date(departureTime.getTime() + 4 * 60 * 60 * 1000) // 4 hour flight

  // Simulate different statuses based on flight number
  const lastDigit = parseInt(flightNumber.slice(-1)) || 0
  const statuses: FlightStatus["status"][] = ["scheduled", "scheduled", "active", "landed", "delayed", "scheduled", "scheduled", "active", "scheduled", "scheduled"]
  const status = statuses[lastDigit]

  return {
    flightNumber: flightNumber.toUpperCase(),
    airline: getAirlineName(flightNumber),
    status,
    departure: {
      airport: "San Francisco International",
      iata: "SFO",
      scheduled: departureTime.toISOString(),
      estimated: status === "delayed" ? new Date(departureTime.getTime() + 45 * 60 * 1000).toISOString() : undefined,
      terminal: "2",
      gate: "D45",
    },
    arrival: {
      airport: "John F. Kennedy International",
      iata: "JFK",
      scheduled: arrivalTime.toISOString(),
      estimated: status === "delayed" ? new Date(arrivalTime.getTime() + 45 * 60 * 1000).toISOString() : undefined,
      terminal: "4",
      gate: "B22",
    },
    delay: status === "delayed" ? 45 : undefined,
  }
}

function getAirlineName(flightNumber: string): string {
  const airlineCodes: Record<string, string> = {
    UA: "United Airlines",
    AA: "American Airlines",
    DL: "Delta Air Lines",
    WN: "Southwest Airlines",
    B6: "JetBlue Airways",
    AS: "Alaska Airlines",
    NK: "Spirit Airlines",
    F9: "Frontier Airlines",
    BA: "British Airways",
    LH: "Lufthansa",
    AF: "Air France",
    KL: "KLM",
    EK: "Emirates",
    QR: "Qatar Airways",
    SQ: "Singapore Airlines",
  }

  const code = flightNumber.slice(0, 2).toUpperCase()
  return airlineCodes[code] || "Unknown Airline"
}
