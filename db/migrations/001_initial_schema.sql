-- Trip Hippo Initial Schema
-- Run this in your Supabase SQL Editor

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Custom types
create type member_role as enum ('owner', 'editor', 'viewer');
create type reservation_type as enum ('flight', 'lodging', 'car', 'rail', 'event', 'other');
create type expense_category as enum ('food', 'transport', 'lodging', 'activities', 'shopping', 'other');

-- =============================================
-- TRIPS
-- =============================================
create table trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  start_date date,
  end_date date,
  home_base text,
  cover_image text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_trips_owner on trips(owner_id);
create index idx_trips_dates on trips(start_date, end_date);

-- =============================================
-- TRIP MEMBERS
-- =============================================
create table trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  role member_role not null default 'viewer',
  invite_code text,
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint unique_trip_user unique (trip_id, user_id),
  constraint unique_trip_email unique (trip_id, email)
);

create index idx_trip_members_trip on trip_members(trip_id);
create index idx_trip_members_user on trip_members(user_id);
create index idx_trip_members_email on trip_members(email);
create index idx_trip_members_invite_code on trip_members(invite_code);

-- =============================================
-- TRIP DAYS
-- =============================================
create table trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  day_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, day_date)
);

create index idx_trip_days_trip on trip_days(trip_id, day_date);

-- =============================================
-- PLACES (normalized cache)
-- =============================================
create table places (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_place_id text not null,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  phone text,
  website text,
  rating numeric,
  price_level int,
  opening_hours jsonb,
  photos jsonb,
  categories jsonb,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_place_id)
);

create index idx_places_provider on places(provider, provider_place_id);
create index idx_places_name on places using gin(to_tsvector('english', name));
create index idx_places_location on places(lat, lng);

-- =============================================
-- ITINERARY ITEMS
-- =============================================
create table itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  day_id uuid references trip_days(id) on delete set null,
  list_name text,
  place_id uuid references places(id) on delete set null,
  title text not null,
  start_time time,
  end_time time,
  sort_order int not null default 0,
  category text,
  notes text,
  links jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_itinerary_items_trip_day on itinerary_items(trip_id, day_id, sort_order);
create index idx_itinerary_items_trip_list on itinerary_items(trip_id, list_name, sort_order);

-- =============================================
-- TRIP LISTS
-- =============================================
create table trip_lists (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (trip_id, name)
);

create index idx_trip_lists_trip on trip_lists(trip_id, sort_order);

-- =============================================
-- ROUTE OPTIMIZATION RUNS
-- =============================================
create table route_runs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  day_id uuid not null references trip_days(id) on delete cascade,
  start_place_id uuid references places(id),
  end_place_id uuid references places(id),
  optimized_order uuid[] not null,
  distance_meters int,
  duration_seconds int,
  polyline text,
  provider text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_route_runs_day on route_runs(trip_id, day_id, created_at desc);

-- =============================================
-- ROUTE SEGMENTS (travel between items)
-- =============================================
create table route_segments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  from_item_id uuid not null references itinerary_items(id) on delete cascade,
  to_item_id uuid not null references itinerary_items(id) on delete cascade,
  distance_meters int,
  duration_seconds int,
  polyline text,
  created_at timestamptz not null default now(),
  unique (from_item_id, to_item_id)
);

-- =============================================
-- RESERVATIONS
-- =============================================
create table reservations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  type reservation_type not null,
  provider text,
  confirmation text,
  start_dt timestamptz,
  end_dt timestamptz,
  title text,
  metadata jsonb not null default '{}'::jsonb,
  source text default 'manual',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_reservations_trip on reservations(trip_id, type, start_dt);

-- =============================================
-- ATTACHMENTS
-- =============================================
create table attachments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  reservation_id uuid references reservations(id) on delete cascade,
  itinerary_item_id uuid references itinerary_items(id) on delete cascade,
  storage_path text not null,
  filename text,
  mime text,
  size_bytes bigint,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_attachments_trip on attachments(trip_id);
create index idx_attachments_reservation on attachments(reservation_id);

-- =============================================
-- BUDGETS
-- =============================================
create table budgets (
  trip_id uuid primary key references trips(id) on delete cascade,
  currency text not null default 'USD',
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================
-- EXPENSES
-- =============================================
create table expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  payer_id uuid references auth.users(id),
  amount numeric not null,
  currency text not null default 'USD',
  category expense_category,
  occurred_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_expenses_trip on expenses(trip_id, occurred_at desc);

-- =============================================
-- EXPENSE SPLITS
-- =============================================
create table expense_splits (
  expense_id uuid not null references expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  primary key (expense_id, user_id)
);

-- =============================================
-- CHECKLIST ITEMS (packing, todos)
-- =============================================
create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  list_name text not null default 'Packing',
  title text not null,
  is_checked boolean not null default false,
  assigned_to uuid references auth.users(id),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_checklist_trip on checklist_items(trip_id, list_name, sort_order);

-- =============================================
-- GUIDES (public content)
-- =============================================
create table guides (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  destination_slug text,
  title text not null,
  excerpt text,
  body jsonb not null default '[]'::jsonb,
  cover_image text,
  is_published boolean not null default false,
  likes_count int not null default 0,
  views_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_guides_published on guides(is_published, updated_at desc);
create index idx_guides_destination on guides(destination_slug);
create index idx_guides_author on guides(author_id);

-- =============================================
-- GUIDE PLACES
-- =============================================
create table guide_places (
  guide_id uuid not null references guides(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  sort_order int not null default 0,
  primary key (guide_id, place_id)
);

-- =============================================
-- JOURNALS
-- =============================================
create table journals (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references trips(id) on delete set null,
  title text not null,
  body jsonb not null default '[]'::jsonb,
  cover_image text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_journals_author on journals(author_id);
create index idx_journals_trip on journals(trip_id);

-- =============================================
-- LIKES
-- =============================================
create table likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, entity_type, entity_id)
);

create index idx_likes_entity on likes(entity_type, entity_id);

-- =============================================
-- AUDIT LOG
-- =============================================
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  diff jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_log_trip on audit_log(trip_id, created_at desc);

-- =============================================
-- AI CHAT MESSAGES
-- =============================================
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  tool_calls jsonb,
  created_at timestamptz not null default now()
);

create index idx_chat_messages_trip on chat_messages(trip_id, created_at);

-- =============================================
-- REPORTS (moderation)
-- =============================================
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id),
  entity_type text not null,
  entity_id uuid not null,
  reason text not null,
  notes text,
  status text not null default 'pending',
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_reports_status on reports(status, created_at desc);

-- =============================================
-- USER PROFILES (extends auth.users)
-- =============================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  bio text,
  countries_visited int not null default 0,
  cities_visited int not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to tables with updated_at
create trigger trips_updated_at before update on trips
  for each row execute function update_updated_at();

create trigger trip_days_updated_at before update on trip_days
  for each row execute function update_updated_at();

create trigger places_updated_at before update on places
  for each row execute function update_updated_at();

create trigger itinerary_items_updated_at before update on itinerary_items
  for each row execute function update_updated_at();

create trigger reservations_updated_at before update on reservations
  for each row execute function update_updated_at();

create trigger budgets_updated_at before update on budgets
  for each row execute function update_updated_at();

create trigger expenses_updated_at before update on expenses
  for each row execute function update_updated_at();

create trigger checklist_items_updated_at before update on checklist_items
  for each row execute function update_updated_at();

create trigger guides_updated_at before update on guides
  for each row execute function update_updated_at();

create trigger journals_updated_at before update on journals
  for each row execute function update_updated_at();

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
