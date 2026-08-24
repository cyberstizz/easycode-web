-- =====================================================================
-- Designher Kustom Kreations — Supabase schema
--
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor → New
-- query → paste → Run). It is safe to re-run: every statement is guarded.
--
-- Two tables:
--   products   the catalog Dianna manages from the admin page
--   inquiries  custom-order requests submitted from the public wizard
--
-- The security model in one sentence: the public may INSERT an inquiry and
-- READ published products, and nothing else. Everything else requires login.
-- =====================================================================

-- ---------------------------------------------------------------- products
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  category      text not null default 'sneakers',
  blurb         text,
  description   text,
  image_url     text,
  published     boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Added after the first release: the product page shows a gallery, so a
-- product needs more than one photo. image_url stays the cover image.
-- `add column if not exists` makes this file safe to re-run on a live
-- database, which is how you upgrade an existing install.
alter table public.products
  add column if not exists images text[] not null default '{}';

comment on column public.products.published is
  'Unpublished rows are invisible to the public site. Dianna''s drafts.';

-- --------------------------------------------------------------- inquiries
create table if not exists public.inquiries (
  id               uuid primary key default gen_random_uuid(),
  -- what they want made
  base             text,
  occasion         text,
  palette          text,
  personalization  text,
  size             text,
  timeline         text,
  budget           text,
  reference_photo  text,
  -- who they are
  full_name        text not null,
  email            text not null,
  phone            text,
  ship_state       text,
  -- Dianna's workflow
  status           text not null default 'new',
  notes            text,
  created_at       timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx
  on public.inquiries (created_at desc);
create index if not exists inquiries_status_idx
  on public.inquiries (status);
create index if not exists products_published_sort_idx
  on public.products (published, sort_order);

-- keep updated_at honest
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- ===================================================================
-- Row Level Security
--
-- RLS is OFF by default in Postgres, which would mean anyone holding the
-- anon key could read every customer's name, email and phone number. The
-- anon key ships in the browser bundle, so treat it as public. These
-- policies are the only thing standing between the internet and that data.
-- ===================================================================
alter table public.products  enable row level security;
alter table public.inquiries enable row level security;

-- products: the world can read published rows
drop policy if exists "public reads published products" on public.products;
create policy "public reads published products"
  on public.products for select
  to anon, authenticated
  using (published = true);

-- products: signed-in admin sees and edits everything, drafts included
drop policy if exists "admin reads all products" on public.products;
create policy "admin reads all products"
  on public.products for select to authenticated using (true);

drop policy if exists "admin writes products" on public.products;
create policy "admin writes products"
  on public.products for insert to authenticated with check (true);

drop policy if exists "admin updates products" on public.products;
create policy "admin updates products"
  on public.products for update to authenticated using (true) with check (true);

drop policy if exists "admin deletes products" on public.products;
create policy "admin deletes products"
  on public.products for delete to authenticated using (true);

-- inquiries: anyone may submit one...
drop policy if exists "public submits inquiry" on public.inquiries;
create policy "public submits inquiry"
  on public.inquiries for insert
  to anon, authenticated
  with check (true);

-- ...and NOBODY anonymous may read them back. There is deliberately no
-- select policy for anon here. Do not add one.
drop policy if exists "admin reads inquiries" on public.inquiries;
create policy "admin reads inquiries"
  on public.inquiries for select to authenticated using (true);

drop policy if exists "admin updates inquiries" on public.inquiries;
create policy "admin updates inquiries"
  on public.inquiries for update to authenticated using (true) with check (true);

drop policy if exists "admin deletes inquiries" on public.inquiries;
create policy "admin deletes inquiries"
  on public.inquiries for delete to authenticated using (true);

-- ===================================================================
-- Storage bucket for product photos
-- ===================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public reads product images" on storage.objects;
create policy "public reads product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "admin uploads product images" on storage.objects;
create policy "admin uploads product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "admin updates product images" on storage.objects;
create policy "admin updates product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

drop policy if exists "admin deletes product images" on storage.objects;
create policy "admin deletes product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- ===================================================================
-- AFTER RUNNING THIS
--
-- 1. Authentication → Providers → Email: turn OFF "Enable sign ups".
--    Otherwise anyone can create an account and, per the policies above,
--    read every inquiry. This step is not optional.
--
-- 2. Authentication → Users → Add user: create one account for Dianna
--    (and one for yourself). Set "Auto Confirm User" so she can log in
--    immediately without an email round-trip.
--
-- 3. Copy Project URL and the anon/public key into .env.local.
-- ===================================================================