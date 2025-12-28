"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import {
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  Plane,
  Building2,
  Car,
  Train,
  Ticket,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { AddExpenseModal } from "./add-expense-modal"
import type { Expense, Budget, TripMember, ExpenseCategory, Reservation, ReservationType } from "@/types"

interface BudgetViewProps {
  tripId: string
  budget: Budget | null
  expenses: Expense[]
  reservations: Reservation[]
  members: TripMember[]
  tripOwnerId?: string
  currentUserId?: string
}

const reservationTypeIcons: Record<ReservationType, typeof Plane> = {
  flight: Plane,
  lodging: Building2,
  car: Car,
  rail: Train,
  event: Ticket,
  other: FileText,
}

const categoryColors: Record<ExpenseCategory, string> = {
  food: "bg-orange-100 text-orange-700",
  transport: "bg-blue-100 text-blue-700",
  lodging: "bg-purple-100 text-purple-700",
  activities: "bg-green-100 text-green-700",
  shopping: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-700",
}

export function BudgetView({
  tripId,
  budget,
  expenses: initialExpenses,
  reservations,
  members,
  tripOwnerId,
  currentUserId,
}: BudgetViewProps) {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Calculate totals
  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  )

  // Calculate booked costs from reservations
  const bookedCosts = useMemo(() => {
    return reservations.reduce((sum, r) => sum + (r.metadata?.cost || 0), 0)
  }, [reservations])

  // Group reservation costs by type
  const reservationCostsByType = useMemo(() => {
    return reservations.reduce((acc, r) => {
      if (r.metadata?.cost) {
        acc[r.type] = (acc[r.type] || 0) + r.metadata.cost
      }
      return acc
    }, {} as Record<ReservationType, number>)
  }, [reservations])

  const totalCosts = totalSpent + bookedCosts
  const remaining = budget ? budget.amount - totalCosts : null

  // Calculate balances for each member
  const balances = useMemo(() => {
    const memberIds = new Set<string>()

    // Add all payers and split users
    expenses.forEach((e) => {
      if (e.payer_id) memberIds.add(e.payer_id)
      e.splits?.forEach((s) => memberIds.add(s.user_id))
    })

    // Add owner and members
    if (tripOwnerId) memberIds.add(tripOwnerId)
    members.forEach((m) => {
      if (m.user_id) memberIds.add(m.user_id)
    })

    const paid: Record<string, number> = {}
    const owed: Record<string, number> = {}

    memberIds.forEach((id) => {
      paid[id] = 0
      owed[id] = 0
    })

    expenses.forEach((e) => {
      if (e.payer_id) {
        paid[e.payer_id] = (paid[e.payer_id] || 0) + e.amount
      }

      if (e.splits && e.splits.length > 0) {
        e.splits.forEach((s) => {
          owed[s.user_id] = (owed[s.user_id] || 0) + s.amount
        })
      } else if (e.payer_id) {
        // If no splits, assume payer owes it all
        owed[e.payer_id] = (owed[e.payer_id] || 0) + e.amount
      }
    })

    return Array.from(memberIds).map((userId) => ({
      userId,
      paid: paid[userId] || 0,
      owed: owed[userId] || 0,
      net: (paid[userId] || 0) - (owed[userId] || 0),
    }))
  }, [expenses, members, tripOwnerId])

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    return expenses.reduce((acc, e) => {
      const cat = e.category || "other"
      acc[cat] = (acc[cat] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)
  }, [expenses])

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {budget
                  ? `${budget.currency} ${budget.amount.toLocaleString()}`
                  : "Not set"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Plane className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Booked</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${bookedCosts.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expenses</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${totalSpent.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {remaining !== null && (
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                  remaining >= 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                <TrendingDown
                  className={`h-6 w-6 ${
                    remaining >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                <p
                  className={`text-xl font-bold ${
                    remaining >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ${remaining.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Receipt className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${totalCosts.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Expenses list */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Expenses</h2>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>

          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <Card key={expense.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {expense.note || "Expense"}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            {format(new Date(expense.occurred_at), "MMM d")}
                          </span>
                          {expense.category && (
                            <Badge
                              className={categoryColors[expense.category]}
                            >
                              {expense.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${expense.amount.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState onAdd={() => setIsAddModalOpen(true)} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booked Costs (from reservations) */}
          {Object.entries(reservationCostsByType).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Booked Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(reservationCostsByType).map(([type, amount]) => {
                    const Icon = reservationTypeIcons[type as ReservationType]
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm capitalize text-gray-700 dark:text-gray-300">{type}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${amount.toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* By category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">By Category</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(expensesByCategory).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(expensesByCategory).map(([cat, amount]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <Badge className={categoryColors[cat as ExpenseCategory]}>
                        {cat}
                      </Badge>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No expenses yet</p>
              )}
            </CardContent>
          </Card>

          {/* Balances */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Balances</CardTitle>
            </CardHeader>
            <CardContent>
              {balances.length > 0 ? (
                <div className="space-y-3">
                  {balances.map((b) => (
                    <div
                      key={b.userId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar size="sm" fallback={b.userId.slice(0, 2)} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {b.userId === currentUserId ? "You" : "Member"}
                        </span>
                      </div>
                      <span
                        className={`font-medium ${
                          b.net >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {b.net >= 0 ? "+" : ""}${b.net.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No balances to show</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add expense modal */}
      <AddExpenseModal
        tripId={tripId}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={(expense) => {
          setExpenses([expense, ...expenses])
          setIsAddModalOpen(false)
        }}
      />
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-8 text-center">
      <DollarSign className="mx-auto h-10 w-10 text-gray-400" />
      <h3 className="mt-2 font-medium text-gray-900 dark:text-white">No expenses yet</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Track your spending and split costs with your travel companions
      </p>
      <Button onClick={onAdd} className="mt-4">
        <Plus className="mr-2 h-4 w-4" />
        Add Expense
      </Button>
    </div>
  )
}
