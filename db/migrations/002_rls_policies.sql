-- Trip Hippo RLS Policies
-- Run this after 001_initial_schema.sql

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Check if user is a member of a trip
create or replace function is_trip_member(_trip_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from trip_members tm
    where tm.trip_id = _trip_id
      and tm.user_id = auth.uid()
      and tm.accepted_at is not null
  )
  or exists (
    select 1 from trips t
    where t.id = _trip_id
      and t.owner_id = auth.uid()
  );
$$;

-- Get user's role in a trip
create or replace function get_trip_role(_trip_id uuid)
returns member_role
language sql
stable
security definer
as $$
  select
    case
      when t.owner_id = auth.uid() then 'owner'::member_role
      else tm.role
    end
  from trips t
  left join trip_members tm on tm.trip_id = t.id and tm.user_id = auth.uid()
  where t.id = _trip_id
  limit 1;
$$;

-- Check if user can edit a trip (owner or editor)
create or replace function can_edit_trip(_trip_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select get_trip_role(_trip_id) in ('owner', 'editor');
$$;

-- =============================================
-- PROFILES
-- =============================================
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (is_public = true or id = auth.uid());

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- =============================================
-- TRIPS
-- =============================================
alter table trips enable row level security;

create policy "Users can view their trips"
  on trips for select
  using (
    owner_id = auth.uid()
    or is_trip_member(id)
    or (settings->>'is_public')::boolean = true
  );

create policy "Users can create trips"
  on trips for insert
  with check (owner_id = auth.uid());

create policy "Owners can update trips"
  on trips for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Owners can delete trips"
  on trips for delete
  using (owner_id = auth.uid());

-- =============================================
-- TRIP MEMBERS
-- =============================================
alter table trip_members enable row level security;

create policy "Members can view trip members"
  on trip_members for select
  using (is_trip_member(trip_id));

create policy "Owners can manage trip members"
  on trip_members for insert
  with check (
    get_trip_role(trip_id) = 'owner'
    or (user_id = auth.uid() and invite_code is not null)
  );

create policy "Owners can update trip members"
  on trip_members for update
  using (get_trip_role(trip_id) = 'owner')
  with check (get_trip_role(trip_id) = 'owner');

create policy "Owners can remove trip members"
  on trip_members for delete
  using (
    get_trip_role(trip_id) = 'owner'
    or user_id = auth.uid()
  );

-- =============================================
-- TRIP DAYS
-- =============================================
alter table trip_days enable row level security;

create policy "Members can view trip days"
  on trip_days for select
  using (is_trip_member(trip_id));

create policy "Editors can create trip days"
  on trip_days for insert
  with check (can_edit_trip(trip_id));

create policy "Editors can update trip days"
  on trip_days for update
  using (can_edit_trip(trip_id))
  with check (can_edit_trip(trip_id));

create policy "Editors can delete trip days"
  on trip_days for delete
  using (can_edit_trip(trip_id));

-- =============================================
-- PLACES (shared cache, mostly public read)
-- =============================================
alter table places enable row level security;

create policy "Anyone can view places"
  on places for select
  using (true);

create policy "Authenticated users can create places"
  on places for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update places"
  on places for update
  using (auth.uid() is not null);

-- =============================================
-- ITINERARY ITEMS
-- =============================================
alter table itinerary_items enable row level security;

create policy "Members can view itinerary items"
  on itinerary_items for select
  using (is_trip_member(trip_id));

create policy "Editors can create itinerary items"
  on itinerary_items for insert
  with check (can_edit_trip(trip_id));

create policy "Editors can update itinerary items"
  on itinerary_items for update
  using (can_edit_trip(trip_id))
  with check (can_edit_trip(trip_id));

create policy "Editors can delete itinerary items"
  on itinerary_items for delete
  using (can_edit_trip(trip_id));

-- =============================================
-- TRIP LISTS
-- =============================================
alter table trip_lists enable row level security;

create policy "Members can view trip lists"
  on trip_lists for select
  using (is_trip_member(trip_id));

create policy "Editors can create trip lists"
  on trip_lists for insert
  with check (can_edit_trip(trip_id));

create policy "Editors can update trip lists"
  on trip_lists for update
  using (can_edit_trip(trip_id))
  with check (can_edit_trip(trip_id));

create policy "Editors can delete trip lists"
  on trip_lists for delete
  using (can_edit_trip(trip_id));

-- =============================================
-- ROUTE RUNS
-- =============================================
alter table route_runs enable row level security;

create policy "Members can view route runs"
  on route_runs for select
  using (is_trip_member(trip_id));

create policy "Editors can create route runs"
  on route_runs for insert
  with check (can_edit_trip(trip_id));

-- =============================================
-- ROUTE SEGMENTS
-- =============================================
alter table route_segments enable row level security;

create policy "Members can view route segments"
  on route_segments for select
  using (is_trip_member(trip_id));

create policy "Editors can manage route segments"
  on route_segments for all
  using (can_edit_trip(trip_id));

-- =============================================
-- RESERVATIONS
-- =============================================
alter table reservations enable row level security;

create policy "Members can view reservations"
  on reservations for select
  using (is_trip_member(trip_id));

create policy "Editors can create reservations"
  on reservations for insert
  with check (can_edit_trip(trip_id));

create policy "Editors can update reservations"
  on reservations for update
  using (can_edit_trip(trip_id))
  with check (can_edit_trip(trip_id));

create policy "Editors can delete reservations"
  on reservations for delete
  using (can_edit_trip(trip_id));

-- =============================================
-- ATTACHMENTS
-- =============================================
alter table attachments enable row level security;

create policy "Members can view attachments"
  on attachments for select
  using (is_trip_member(trip_id));

create policy "Editors can create attachments"
  on attachments for insert
  with check (can_edit_trip(trip_id));

create policy "Editors can delete attachments"
  on attachments for delete
  using (can_edit_trip(trip_id));

-- =============================================
-- BUDGETS
-- =============================================
alter table budgets enable row level security;

create policy "Members can view budgets"
  on budgets for select
  using (is_trip_member(trip_id));

create policy "Editors can manage budgets"
  on budgets for all
  using (can_edit_trip(trip_id));

-- =============================================
-- EXPENSES
-- =============================================
alter table expenses enable row level security;

create policy "Members can view expenses"
  on expenses for select
  using (is_trip_member(trip_id));

create policy "Members can create expenses"
  on expenses for insert
  with check (is_trip_member(trip_id));

create policy "Editors can update expenses"
  on expenses for update
  using (can_edit_trip(trip_id) or payer_id = auth.uid())
  with check (can_edit_trip(trip_id) or payer_id = auth.uid());

create policy "Editors can delete expenses"
  on expenses for delete
  using (can_edit_trip(trip_id) or payer_id = auth.uid());

-- =============================================
-- EXPENSE SPLITS
-- =============================================
alter table expense_splits enable row level security;

create policy "Members can view expense splits"
  on expense_splits for select
  using (
    exists (
      select 1 from expenses e
      where e.id = expense_id
        and is_trip_member(e.trip_id)
    )
  );

create policy "Members can manage expense splits"
  on expense_splits for all
  using (
    exists (
      select 1 from expenses e
      where e.id = expense_id
        and (can_edit_trip(e.trip_id) or e.payer_id = auth.uid())
    )
  );

-- =============================================
-- CHECKLIST ITEMS
-- =============================================
alter table checklist_items enable row level security;

create policy "Members can view checklist items"
  on checklist_items for select
  using (is_trip_member(trip_id));

create policy "Editors can create checklist items"
  on checklist_items for insert
  with check (can_edit_trip(trip_id));

create policy "Editors can update checklist items"
  on checklist_items for update
  using (can_edit_trip(trip_id))
  with check (can_edit_trip(trip_id));

create policy "Editors can delete checklist items"
  on checklist_items for delete
  using (can_edit_trip(trip_id));

-- =============================================
-- GUIDES
-- =============================================
alter table guides enable row level security;

create policy "Published guides are public"
  on guides for select
  using (is_published = true or author_id = auth.uid());

create policy "Users can create guides"
  on guides for insert
  with check (author_id = auth.uid());

create policy "Authors can update guides"
  on guides for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "Authors can delete guides"
  on guides for delete
  using (author_id = auth.uid());

-- =============================================
-- GUIDE PLACES
-- =============================================
alter table guide_places enable row level security;

create policy "Guide places follow guide visibility"
  on guide_places for select
  using (
    exists (
      select 1 from guides g
      where g.id = guide_id
        and (g.is_published = true or g.author_id = auth.uid())
    )
  );

create policy "Authors can manage guide places"
  on guide_places for all
  using (
    exists (
      select 1 from guides g
      where g.id = guide_id
        and g.author_id = auth.uid()
    )
  );

-- =============================================
-- JOURNALS
-- =============================================
alter table journals enable row level security;

create policy "Published journals are public"
  on journals for select
  using (is_published = true or author_id = auth.uid());

create policy "Users can create journals"
  on journals for insert
  with check (author_id = auth.uid());

create policy "Authors can update journals"
  on journals for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "Authors can delete journals"
  on journals for delete
  using (author_id = auth.uid());

-- =============================================
-- LIKES
-- =============================================
alter table likes enable row level security;

create policy "Likes are public"
  on likes for select
  using (true);

create policy "Users can manage their likes"
  on likes for all
  using (user_id = auth.uid());

-- =============================================
-- AUDIT LOG
-- =============================================
alter table audit_log enable row level security;

create policy "Members can view trip audit log"
  on audit_log for select
  using (is_trip_member(trip_id));

create policy "System can insert audit log"
  on audit_log for insert
  with check (actor_id = auth.uid() or actor_id is null);

-- =============================================
-- CHAT MESSAGES
-- =============================================
alter table chat_messages enable row level security;

create policy "Members can view chat messages"
  on chat_messages for select
  using (is_trip_member(trip_id));

create policy "Members can create chat messages"
  on chat_messages for insert
  with check (is_trip_member(trip_id) and user_id = auth.uid());

-- =============================================
-- REPORTS
-- =============================================
alter table reports enable row level security;

create policy "Users can view their reports"
  on reports for select
  using (reporter_id = auth.uid());

create policy "Users can create reports"
  on reports for insert
  with check (reporter_id = auth.uid());
