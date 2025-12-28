import { NextRequest, NextResponse } from "next/server"

// OpenWeatherMap API (free tier available)
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY

interface WeatherData {
  location: string
  temperature: number
  feelsLike: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  high: number
  low: number
  forecast?: ForecastDay[]
}

interface ForecastDay {
  date: string
  high: number
  low: number
  description: string
  icon: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get("location")
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!location && (!lat || !lon)) {
    return NextResponse.json(
      { error: "Location or coordinates required" },
      { status: 400 }
    )
  }

  // If no API key, return mock data for development
  if (!OPENWEATHER_API_KEY) {
    return NextResponse.json(getMockWeatherData(location || "Unknown"))
  }

  try {
    // Get coordinates from location name if needed
    let latitude = lat
    let longitude = lon
    let locationName = location

    if (location && (!lat || !lon)) {
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${OPENWEATHER_API_KEY}`
      const geoResponse = await fetch(geoUrl)
      const geoData = await geoResponse.json()

      if (geoData.length === 0) {
        return NextResponse.json(
          { error: "Location not found" },
          { status: 404 }
        )
      }

      latitude = geoData[0].lat
      longitude = geoData[0].lon
      locationName = geoData[0].name
    }

    // Get current weather
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${OPENWEATHER_API_KEY}`
    const weatherResponse = await fetch(weatherUrl)
    const weatherData = await weatherResponse.json()

    // Get 5-day forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=imperial&appid=${OPENWEATHER_API_KEY}`
    const forecastResponse = await fetch(forecastUrl)
    const forecastData = await forecastResponse.json()

    // Process forecast to get daily summaries
    const dailyForecast = processForecast(forecastData.list)

    const result: WeatherData = {
      location: locationName || weatherData.name,
      temperature: Math.round(weatherData.main.temp),
      feelsLike: Math.round(weatherData.main.feels_like),
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      humidity: weatherData.main.humidity,
      windSpeed: Math.round(weatherData.wind.speed),
      high: Math.round(weatherData.main.temp_max),
      low: Math.round(weatherData.main.temp_min),
      forecast: dailyForecast,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    )
  }
}

function processForecast(list: any[]): ForecastDay[] {
  const days: Record<string, any[]> = {}

  list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0]
    if (!days[date]) days[date] = []
    days[date].push(item)
  })

  return Object.entries(days)
    .slice(0, 5)
    .map(([date, items]) => {
      const temps = items.map((i) => i.main.temp)
      const middleItem = items[Math.floor(items.length / 2)]

      return {
        date,
        high: Math.round(Math.max(...temps)),
        low: Math.round(Math.min(...temps)),
        description: middleItem.weather[0].description,
        icon: middleItem.weather[0].icon,
      }
    })
}

function getMockWeatherData(location: string): WeatherData {
  return {
    location,
    temperature: 72,
    feelsLike: 74,
    description: "Partly cloudy",
    icon: "02d",
    humidity: 55,
    windSpeed: 8,
    high: 78,
    low: 65,
    forecast: [
      { date: new Date().toISOString().split("T")[0], high: 78, low: 65, description: "Partly cloudy", icon: "02d" },
      { date: new Date(Date.now() + 86400000).toISOString().split("T")[0], high: 80, low: 66, description: "Sunny", icon: "01d" },
      { date: new Date(Date.now() + 172800000).toISOString().split("T")[0], high: 75, low: 62, description: "Light rain", icon: "10d" },
      { date: new Date(Date.now() + 259200000).toISOString().split("T")[0], high: 73, low: 60, description: "Cloudy", icon: "04d" },
      { date: new Date(Date.now() + 345600000).toISOString().split("T")[0], high: 77, low: 63, description: "Sunny", icon: "01d" },
    ],
  }
}
