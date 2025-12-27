"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { use } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const suggestedPrompts = [
  "Create a 3-day itinerary for my saved places",
  "Suggest the best restaurants near my hotel",
  "What should I pack for this trip?",
  "Optimize my itinerary for Day 1",
]

export default function AssistantPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = use(params)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm your AI travel assistant! I can help you plan your itinerary, suggest places to visit, optimize your routes, and answer questions about your destinations. This feature is coming soon with full AI capabilities.\n\nIn the meantime, you can use the itinerary and map views to plan your trip manually.",
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
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
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Trip AI Assistant
            </h2>
            <p className="mb-8 max-w-md text-center text-gray-600">
              I can help you plan your trip, suggest places, optimize your route,
              and answer travel questions.
            </p>

            {/* Suggested prompts */}
            <div className="flex max-w-lg flex-wrap justify-center gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handlePromptClick(prompt)}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-900 shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
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
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
