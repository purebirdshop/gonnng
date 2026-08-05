-- Target Database Schema (Supabase / Postgres)
-- Reference SQL copy for application developer inspection

-- ENUMS
create type profile_visibility as enum ('public', 'internal', 'private');
create type recipe_visibility as enum ('private', 'public');
create type media_type as enum ('image', 'video');
create type feedback_type as enum ('success', 'promise', 'potential');
create type permission_type as enum ('camera', 'microphone', 'file_access');
create type permission_status as enum ('granted', 'denied', 'not_requested');

-- USERS
create table users (
  id uuid primary key default gen_random_uuid(),          -- internal id
  public_id text unique not null,                          -- public-facing id (defaults to username)
  username text unique not null,
  email text unique not null,
  about text,
  profile_visibility profile_visibility not null default 'public',
  created_at timestamptz not null default now()
);

-- RECIPES
create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  visibility recipe_visibility not null default 'private',
  forked_from_recipe_id uuid references recipes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table recipe_phases (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  title text not null,
  position int not null,
  created_at timestamptz not null default now()
);

create table recipe_tasks (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references recipe_phases(id) on delete cascade,
  title text not null,
  position int not null,
  created_at timestamptz not null default now()
);

create table recipe_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

-- PROJECTS (execution of a recipe)
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete set null,  -- source recipe this was started from
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  source_phase_id uuid references recipe_phases(id) on delete set null,
  title text not null,
  position int not null,
  is_complete boolean not null default false
);

create table project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_phase_id uuid not null references project_phases(id) on delete cascade,
  source_task_id uuid references recipe_tasks(id) on delete set null,
  title text not null,
  position int not null,
  is_complete boolean not null default false
);

-- POSTS
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,  -- active project this post is a status update on
  description text,
  created_at timestamptz not null default now()
);

create table post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  media_type media_type not null,
  position int not null,       -- display order for multi-media posts
  width int,
  height int,
  duration_ms int              -- null for images
);

-- FEEDBACK (post "reactions")
create table post_feedback (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  feedback_type feedback_type not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- COMMENTS (with sub-comments)
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  parent_comment_id uuid references comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- FOLLOWS
create table follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references users(id) on delete cascade,   -- this user follows...
  followee_id uuid not null references users(id) on delete cascade,   -- ...this user
  created_at timestamptz not null default now(),
  unique (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- CIRCLES VIEW (mutual follows)
create view circles as
select f1.follower_id as user_id, f1.followee_id as circle_user_id
from follows f1
join follows f2
  on f1.follower_id = f2.followee_id
 and f1.followee_id = f2.follower_id;

-- USER DEVICE PERMISSIONS
create table user_device_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  device_id text not null,
  permission_type permission_type not null,
  status permission_status not null default 'not_requested',
  updated_at timestamptz not null default now(),
  unique (user_id, device_id, permission_type)
);

alter table user_device_permissions enable row level security;

create policy "user_device_permissions_select_own"
  on user_device_permissions for select
  using (user_id = auth.uid());

create policy "user_device_permissions_upsert_own"
  on user_device_permissions for insert
  with check (user_id = auth.uid());

create policy "user_device_permissions_update_own"
  on user_device_permissions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

