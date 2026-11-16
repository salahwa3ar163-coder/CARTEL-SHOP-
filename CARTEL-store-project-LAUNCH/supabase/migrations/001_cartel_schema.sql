-- CARTEL starter schema — run once in Supabase SQL Editor.
-- Admin access is granted only to user IDs explicitly added to private.admin_users.

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
revoke all on schema private from public, anon, authenticated;
revoke all on table private.admin_users from public, anon, authenticated;

create or replace function public.is_cartel_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admin_users
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_cartel_admin() from public;
grant execute on function public.is_cartel_admin() to anon, authenticated;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null default '',
  price integer not null check (price >= 0),
  image_url text not null,
  back_image_url text,
  category text not null default 'APPAREL',
  sizes text[] not null default array['S','M','L','XL','XXL'],
  colors text[] not null default array['Black'],
  stock integer not null default 0 check (stock >= 0),
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  phone text not null,
  email text not null,
  city text not null,
  address text not null,
  items jsonb not null,
  subtotal integer not null,
  delivery_fee integer not null,
  total integer not null,
  status text not null default 'New'
    check (status in ('New','Confirmed','Preparing','Shipped','Delivered','Cancelled')),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Public catalog: read active products only.
drop policy if exists "public read active products" on public.products;
create policy "public read active products"
on public.products for select to anon, authenticated
using (active = true or public.is_cartel_admin());

-- Only allowlisted CARTEL admins can manage catalog.
drop policy if exists "authenticated admins manage products" on public.products;
drop policy if exists "cartel admins insert products" on public.products;
drop policy if exists "cartel admins update products" on public.products;
drop policy if exists "cartel admins delete products" on public.products;
create policy "cartel admins insert products"
on public.products for insert to authenticated
with check (public.is_cartel_admin());
create policy "cartel admins update products"
on public.products for update to authenticated
using (public.is_cartel_admin()) with check (public.is_cartel_admin());
create policy "cartel admins delete products"
on public.products for delete to authenticated
using (public.is_cartel_admin());

-- Visitors can submit orders but cannot read customer/order data.
drop policy if exists "public create orders" on public.orders;
create policy "public create orders"
on public.orders for insert to anon, authenticated
with check (true);

drop policy if exists "admins read and update orders" on public.orders;
drop policy if exists "cartel admins read orders" on public.orders;
drop policy if exists "cartel admins update orders" on public.orders;
drop policy if exists "cartel admins delete orders" on public.orders;
create policy "cartel admins read orders"
on public.orders for select to authenticated
using (public.is_cartel_admin());
create policy "cartel admins update orders"
on public.orders for update to authenticated
using (public.is_cartel_admin()) with check (public.is_cartel_admin());
create policy "cartel admins delete orders"
on public.orders for delete to authenticated
using (public.is_cartel_admin());

-- Public image reads; only allowlisted admins can upload/change/delete.
insert into storage.buckets (id,name,public)
values ('product-images','product-images',true)
on conflict (id) do nothing;

drop policy if exists "public can view product images" on storage.objects;
drop policy if exists "authenticated can upload product images" on storage.objects;
drop policy if exists "authenticated can update product images" on storage.objects;
create policy "public can view product images"
on storage.objects for select to anon, authenticated
using (bucket_id='product-images');
create policy "cartel admins upload product images"
on storage.objects for insert to authenticated
with check (bucket_id='product-images' and public.is_cartel_admin());
create policy "cartel admins update product images"
on storage.objects for update to authenticated
using (bucket_id='product-images' and public.is_cartel_admin())
with check (bucket_id='product-images' and public.is_cartel_admin());
create policy "cartel admins delete product images"
on storage.objects for delete to authenticated
using (bucket_id='product-images' and public.is_cartel_admin());

insert into public.products (name,slug,description,price,image_url,category,sizes,colors,stock,featured)
values
('CARTEL BLACK JERSEY','cartel-black-jersey','Football-inspired technical jersey built for the street.',299,'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1100&q=85','JERSEYS',array['S','M','L','XL','XXL'],array['Black'],30,true),
('CARTEL MATCHING SHORTS','cartel-matching-shorts','Black sports shorts with a clean athletic finish.',199,'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1100&q=85','BOTTOMS',array['S','M','L','XL','XXL'],array['Black'],30,false),
('CARTEL FULL SET','cartel-full-set','Matching black jersey and shorts.',449,'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1100&q=85','SETS',array['S','M','L','XL','XXL'],array['Black'],20,true),
('CARTEL OVERSIZED TEE','cartel-oversized-tee','Premium black oversized T-shirt.',249,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1100&q=85','TEES',array['S','M','L','XL','XXL'],array['Black','White'],25,false)
on conflict (slug) do nothing;
