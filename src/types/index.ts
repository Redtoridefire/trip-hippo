// Core domain types for the travel planner

export type MemberRole = "owner" | "editor" | "viewer"
export type ReservationType = "flight" | "lodging" | "car" | "rail" | "event" | "other"
export type ExpenseCategory = "food" | "transport" | "lodging" | "activities" | "shopping" | "other"

// User
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
}

// Profile (database table)
export interface Profile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  bio: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

// Trip
export interface Trip {
  id: string
  owner_id: string
  name: string
  description?: string
  start_date?: string
  end_date?: string
  home_base?: string
  cover_image?: string
  settings: TripSettings
  created_at: string
  updated_at: string
}

export interface TripSettings {
  currency?: string
  timezone?: string
  is_public?: boolean
}

export interface TripWithMembers extends Trip {
  members: TripMember[]
  owner?: User
}

// Trip Members
export interface TripMember {
  id: string
  trip_id: string
  user_id?: string
  email?: string
  role: MemberRole
  invited_by?: string
  invited_at: string
  accepted_at?: string
  user?: User
  profile?: Profile
}

// Trip Days
export interface TripDay {
  id: string
  trip_id: string
  day_date: string
  notes?: string
  created_at: string
  updated_at: string
}

// Places (normalized cache)
export interface Place {
  id: string
  provider: string
  provider_place_id: string
  name: string
  address?: string
  description?: string
  lat?: number
  lng?: number
  phone?: string
  website?: string
  rating?: number
  price_level?: number
  opening_hours?: string[]
  photos?: string[]
  categories?: string[]
  created_at: string
}

// Itinerary Items
export interface ItineraryItem {
  id: string
  trip_id: string
  day_id?: string
  list_name?: string
  place_id?: string
  title: string
  start_time?: string
  end_time?: string
  sort_order: number
  category?: string
  notes?: string
  links?: ItemLink[]
  created_by?: string
  created_at: string
  updated_at: string
  place?: Place
}

export interface ItemLink {
  url: string
  label?: string
}

// Route optimization
export interface RouteRun {
  id: string
  trip_id: string
  day_id: string
  start_place_id?: string
  end_place_id?: string
  optimized_order: string[]
  distance_meters?: number
  duration_seconds?: number
  polyline?: string
  provider?: string
  created_by?: string
  created_at: string
}

export interface RouteSegment {
  from_item_id: string
  to_item_id: string
  distance_meters: number
  duration_seconds: number
  polyline?: string
}

// Reservations
export interface Reservation {
  id: string
  trip_id: string
  type: ReservationType
  provider?: string
  confirmation?: string
  start_dt?: string
  end_dt?: string
  title?: string
  metadata: ReservationMetadata
  source?: "manual" | "email_forward" | "gmail"
  created_by?: string
  created_at: string
  updated_at: string
  attachments?: Attachment[]
}

export interface ReservationMetadata {
  flight_number?: string
  airline?: string
  departure_airport?: string
  arrival_airport?: string
  hotel_name?: string
  hotel_address?: string
  travelers?: string[]
  notes?: string
  cost?: number
  currency?: string
}

// Attachments
export interface Attachment {
  id: string
  trip_id: string
  reservation_id?: string
  itinerary_item_id?: string
  storage_path: string
  filename?: string
  mime?: string
  size_bytes?: number
  created_by?: string
  created_at: string
}

// Budgets & Expenses
export interface Budget {
  trip_id: string
  currency: string
  amount: number
}

export interface Expense {
  id: string
  trip_id: string
  payer_id?: string
  amount: number
  currency: string
  category?: ExpenseCategory
  occurred_at: string
  note?: string
  created_at: string
  payer?: User
  splits?: ExpenseSplit[]
}

export interface ExpenseSplit {
  expense_id: string
  user_id: string
  amount: number
  user?: User
}

export interface SettlementBalance {
  user_id: string
  user?: User
  paid: number
  owed: number
  net: number
}

export interface SettlementTransfer {
  from_user_id: string
  to_user_id: string
  amount: number
  from_user?: User
  to_user?: User
}

// Guides (public content)
export interface Guide {
  id: string
  author_id: string
  destination_slug?: string
  title: string
  excerpt?: string
  body: GuideBlock[]
  is_published: boolean
  likes_count: number
  views_count: number
  cover_image?: string
  created_at: string
  updated_at: string
  author?: User
  places?: Place[]
}

export interface GuideBlock {
  type: "text" | "heading" | "place" | "image"
  content?: string
  place_id?: string
  image_url?: string
  caption?: string
}

// Activity/Audit Log
export interface AuditLogEntry {
  id: string
  trip_id?: string
  actor_id?: string
  action: string
  entity_type?: string
  entity_id?: string
  diff?: Record<string, unknown>
  created_at: string
  actor?: User
}

// Lists (generic lists like "Restaurants", "Things to do")
export interface TripList {
  id: string
  trip_id: string
  name: string
  sort_order: number
  created_at: string
}

// Packing/Checklist items
export interface ChecklistItem {
  id: string
  trip_id: string
  list_id?: string
  list_name?: string
  title: string
  is_checked: boolean
  assigned_to?: string
  sort_order: number
  created_at: string
}

// AI Assistant
export interface ChatMessage {
  id: string
  trip_id: string
  role: "user" | "assistant"
  content: string
  tool_calls?: ToolCall[]
  created_at: string
}

export interface ToolCall {
  name: string
  arguments: Record<string, unknown>
  result?: unknown
}

// Map types
export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface MapPin {
  id: string
  lat: number
  lng: number
  title: string
  category?: string
  color?: string
}

// Provider interfaces
export interface PlaceSearchResult {
  provider: string
  provider_place_id: string
  name: string
  address?: string
  lat?: number
  lng?: number
  categories?: string[]
  distance_meters?: number
}

export interface DirectionsResult {
  distance_meters: number
  duration_seconds: number
  polyline: string
  steps?: DirectionStep[]
}

export interface DirectionStep {
  instruction: string
  distance_meters: number
  duration_seconds: number
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
