"use client"

import { useState, useMemo } from "react"
import { Plus, CheckSquare, Square, Trash2, List } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChecklistItem } from "@/types"

interface ChecklistViewProps {
  tripId: string
  items: ChecklistItem[]
}

const defaultLists = ["Packing", "Documents", "To-Do"]

export function ChecklistView({
  tripId,
  items: initialItems,
}: ChecklistViewProps) {
  const [items, setItems] = useState(initialItems)
  const [newItemText, setNewItemText] = useState("")
  const [activeList, setActiveList] = useState("Packing")
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  // Get all unique list names
  const listNames = useMemo(() => {
    const names = new Set(defaultLists)
    items.forEach((item) => names.add(item.list_name || "Packing"))
    return Array.from(names)
  }, [items])

  // Filter items by active list
  const filteredItems = useMemo(
    () => items.filter((item) => (item.list_name || "Packing") === activeList),
    [items, activeList]
  )

  // Count checked items
  const checkedCount = filteredItems.filter((item) => item.is_checked).length
  const totalCount = filteredItems.length

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItemText.trim()) return

    setLoading(true)

    const newItem = {
      trip_id: tripId,
      list_name: activeList,
      title: newItemText.trim(),
      is_checked: false,
      sort_order: items.length,
    }

    const { data, error } = await supabase
      .from("checklist_items")
      .insert(newItem)
      .select()
      .single()

    setLoading(false)

    if (!error && data) {
      setItems([...items, data])
      setNewItemText("")
    }
  }

  async function handleToggle(item: ChecklistItem) {
    const newChecked = !item.is_checked

    // Optimistic update
    setItems(
      items.map((i) => (i.id === item.id ? { ...i, is_checked: newChecked } : i))
    )

    await supabase
      .from("checklist_items")
      .update({ is_checked: newChecked })
      .eq("id", item.id)
  }

  async function handleDelete(itemId: string) {
    setItems(items.filter((i) => i.id !== itemId))

    await supabase.from("checklist_items").delete().eq("id", itemId)
  }

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Checklists</h2>
        <p className="text-sm text-gray-600">
          Keep track of packing, documents, and to-dos
        </p>
      </div>

      {/* List tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {listNames.map((listName) => {
          const count = items.filter(
            (i) => (i.list_name || "Packing") === listName
          ).length
          return (
            <button
              key={listName}
              onClick={() => setActiveList(listName)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeList === listName
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <List className="h-4 w-4" />
              {listName}
              {count > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 text-xs">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-gray-600">
              {checkedCount} of {totalCount} completed
            </span>
            <span className="font-medium text-gray-900">
              {Math.round((checkedCount / totalCount) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${(checkedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist items */}
      <Card>
        <CardContent className="p-4">
          {/* Add item form */}
          <form onSubmit={handleAddItem} className="mb-4 flex gap-2">
            <Input
              placeholder={`Add item to ${activeList}...`}
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!newItemText.trim()} loading={loading}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          {/* Items list */}
          {filteredItems.length > 0 ? (
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                >
                  <button
                    onClick={() => handleToggle(item)}
                    className="flex-shrink-0 text-gray-400 hover:text-blue-600"
                  >
                    {item.is_checked ? (
                      <CheckSquare className="h-5 w-5 text-green-600" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                  <span
                    className={`flex-1 ${
                      item.is_checked
                        ? "text-gray-400 line-through"
                        : "text-gray-900"
                    }`}
                  >
                    {item.title}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-shrink-0 text-gray-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <CheckSquare className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2">No items in {activeList} yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
