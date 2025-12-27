"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles, AlertCircle, Plus, Check, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { use } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ExtractedPlace {
  name: string
  description: string
}

const suggestedPrompts = [
  "Create a 3-day itinerary for my trip",
  "Suggest the best restaurants in this area",
  "What should I pack for this trip?",
  "What are the must-see attractions?",
  "Give me local tips and hidden gems",
]

// Simple markdown renderer
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let listKey = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="my-2 ml-4 space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-blue-500 mt-1.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  const formatInline = (text: string): string => {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-blue-600 hover:underline">$1</a>')
    return text
  }

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()

    // Headers
    if (trimmedLine.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={index} className="mt-4 mb-2 text-base font-semibold text-gray-900">
          {trimmedLine.slice(4)}
        </h3>
      )
      return
    }

    if (trimmedLine.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={index} className="mt-4 mb-2 text-lg font-semibold text-gray-900">
          {trimmedLine.slice(3)}
        </h2>
      )
      return
    }

    // List items
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      listItems.push(trimmedLine.slice(2))
      return
    }

    // Numbered list items
    if (/^\d+\.\s/.test(trimmedLine)) {
      const content = trimmedLine.replace(/^\d+\.\s/, '')
      listItems.push(content)
      return
    }

    // Empty line
    if (!trimmedLine) {
      flushList()
      elements.push(<div key={index} className="h-2" />)
      return
    }

    // Regular paragraph
    flushList()
    elements.push(
      <p key={index} className="my-1" dangerouslySetInnerHTML={{ __html: formatInline(trimmedLine) }} />
    )
  })

  flushList()
  return elements
}

// Extract place suggestions from message
function extractPlaces(content: string): ExtractedPlace[] {
  const places: ExtractedPlace[] = []
  // Match **Place Name** - Description pattern
  const regex = /\*\*([^*]+)\*\*\s*[-–—:]\s*([^*\n]+)/g
  let match

  while ((match = regex.exec(content)) !== null) {
    const name = match[1].trim()
    const description = match[2].trim()
    // Filter out generic terms
    if (name.length > 2 && !['Day', 'Morning', 'Afternoon', 'Evening', 'Night', 'Tip', 'Note'].includes(name)) {
      places.push({ name, description })
    }
  }

  return places
}

export default function AssistantPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = use(params)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addedPlaces, setAddedPlaces] = useState<Set<string>>(new Set())
  const [addingPlace, setAddingPlace] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          tripId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddToTrip(place: ExtractedPlace) {
    setAddingPlace(place.name)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error: insertError } = await supabase
        .from("itinerary_items")
        .insert({
          trip_id: tripId,
          title: place.name,
          notes: place.description,
          sort_order: 999,
          created_by: user?.id,
        })

      if (insertError) {
        console.error("Error adding place:", insertError)
        return
      }

      setAddedPlaces((prev) => new Set([...prev, place.name]))
    } catch (err) {
      console.error("Error adding place:", err)
    } finally {
      setAddingPlace(null)
    }
  }

  function handlePromptClick(prompt: string) {
    setInput(prompt)
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Messages area */}
      <div className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Trip AI Assistant
            </h2>
            <p className="mb-8 max-w-md text-center text-gray-600">
              I can help you plan your trip, suggest places, optimize your route,
              and answer travel questions. Click any suggestion to get started!
            </p>

            {/* Suggested prompts */}
            <div className="flex max-w-lg flex-wrap justify-center gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handlePromptClick(prompt)}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-blue-300 hover:shadow"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {messages.map((message) => {
              const places = message.role === "assistant" ? extractPlaces(message.content) : []

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="max-w-[85%] space-y-3">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 shadow-sm border border-gray-100"
                      }`}
                    >
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          {renderMarkdown(message.content)}
                        </div>
                      )}
                    </div>

                    {/* Add to trip buttons for extracted places */}
                    {places.length > 0 && (
                      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                        <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Add to your itinerary:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {places.slice(0, 8).map((place, i) => {
                            const isAdded = addedPlaces.has(place.name)
                            const isAdding = addingPlace === place.name
                            return (
                              <button
                                key={i}
                                onClick={() => !isAdded && handleAddToTrip(place)}
                                disabled={isAdded || isAdding}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                                  isAdded
                                    ? "bg-green-100 text-green-700 cursor-default"
                                    : "bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 shadow-sm border border-gray-200"
                                }`}
                              >
                                {isAdding ? (
                                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                ) : isAdded ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                                {place.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              )
            })}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your trip..."
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
