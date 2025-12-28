"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  label?: string
  value?: string // ISO string or datetime-local format
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  showTime?: boolean
}

export function DateTimePicker({
  label,
  value,
  onChange,
  placeholder = "Select date and time",
  className,
  showTime = true,
}: DateTimePickerProps) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")

  // Parse incoming value
  useEffect(() => {
    if (value) {
      // Handle both ISO strings and datetime-local format
      const dt = value.includes("T") ? value.split("T") : value.split(" ")
      setDate(dt[0] || "")
      if (dt[1]) {
        // Take only HH:MM, ignore seconds/timezone
        setTime(dt[1].slice(0, 5))
      }
    } else {
      setDate("")
      setTime("")
    }
  }, [value])

  // Combine and emit
  function handleChange(newDate: string, newTime: string) {
    setDate(newDate)
    setTime(newTime)

    if (newDate) {
      if (showTime && newTime) {
        onChange(`${newDate}T${newTime}`)
      } else if (showTime) {
        onChange(`${newDate}T00:00`)
      } else {
        onChange(newDate)
      }
    } else {
      onChange("")
    }
  }

  // Quick time presets
  const timePresets = [
    { label: "Morning", time: "09:00" },
    { label: "Noon", time: "12:00" },
    { label: "Afternoon", time: "15:00" },
    { label: "Evening", time: "18:00" },
  ]

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="flex gap-2">
        {/* Date input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => handleChange(e.target.value, time)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-10 pr-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Time input */}
        {showTime && (
          <div className="relative w-32">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="time"
              value={time}
              onChange={(e) => handleChange(date, e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-10 pr-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Time presets */}
      {showTime && date && (
        <div className="flex flex-wrap gap-1">
          {timePresets.map((preset) => (
            <button
              key={preset.time}
              type="button"
              onClick={() => handleChange(date, preset.time)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                time === preset.time
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
