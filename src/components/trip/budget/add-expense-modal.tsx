"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Expense, ExpenseCategory } from "@/types"

interface AddExpenseModalProps {
  tripId: string
  isOpen: boolean
  onClose: () => void
  onCreated: (expense: Expense) => void
}

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: "food", label: "Food & Dining" },
  { value: "transport", label: "Transportation" },
  { value: "lodging", label: "Lodging" },
  { value: "activities", label: "Activities" },
  { value: "shopping", label: "Shopping" },
  { value: "other", label: "Other" },
]

export function AddExpenseModal({
  tripId,
  isOpen,
  onClose,
  onCreated,
}: AddExpenseModalProps) {
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [category, setCategory] = useState<ExpenseCategory>("other")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const expenseData = {
      trip_id: tripId,
      payer_id: user?.id,
      amount: amountNum,
      currency: "USD",
      category,
      occurred_at: new Date(date).toISOString(),
      note: note.trim() || null,
    }

    const { data, error: insertError } = await supabase
      .from("expenses")
      .insert(expenseData)
      .select()
      .single()

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    onCreated(data)
    resetForm()
  }

  function resetForm() {
    setAmount("")
    setNote("")
    setCategory("other")
    setDate(new Date().toISOString().split("T")[0])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add Expense</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Input
            type="number"
            label="Amount"
            placeholder="0.00"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <Input
            label="Description"
            placeholder="What was this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Add Expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
