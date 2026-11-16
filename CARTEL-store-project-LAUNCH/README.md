# CARTEL — Official Streetwear Store

A responsive React + Vite storefront for the CARTEL demo collection. It includes a persistent browser cart, product detail selection, COD checkout UI, Supabase order/catalog integration, and a private authenticated admin order view.

## 1. Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Open the local URL printed by Vite. Without Supabase variables the store runs in **demo mode**: catalog and cart work in the browser, but orders are not saved and admin login is unavailable.

## 2. Connect Supabase

1. Create a project at https://supabase.com.
2. Open **SQL Editor**, paste and run `supabase/migrations/001_cartel_schema.sql`.
3. In Project Settings → API, copy the Project URL and `anon` public key into `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Restart `npm run dev`. The storefront will load active products from Supabase and checkout will insert orders into `public.orders`.

**Important security note:** The migration uses a private admin allowlist (`private.admin_users`) so ordinary authenticated accounts do not gain admin access. Add the store owner's Auth user UUID to that table after creating the account.

### Create the admin account

1. In Supabase → Authentication → Users, create/invite the store-owner account.
2. Copy that user's UUID from the Users table.
3. In SQL Editor run `insert into private.admin_users (user_id) values ('PASTE-USER-UUID-HERE');` using the real UUID.
4. Sign in at the site's footer **PRIVATE ACCESS** link. Only user IDs in `private.admin_users` can read orders or manage catalog/storage. Never publish credentials or expose a service-role key in `.env` or frontend code.

## 3. Order notifications

The checkout currently saves the order row in Supabase. Email notification is **not automatically active** until configured.

1. Verify a sending domain in https://resend.com.
2. Deploy the Edge Function in `supabase/functions/order-notification`.
3. Set function secrets: `RESEND_API_KEY`, `STORE_OWNER_EMAIL`, `ORDER_WEBHOOK_SECRET`.
4. Replace `orders@your-verified-domain.com` in the function with a sender address on your verified domain.
5. In Supabase Database Webhooks, create an INSERT webhook on `public.orders` pointing to the deployed Edge Function URL and send `x-webhook-secret` with the configured secret.
6. Test with a low-value test order and confirm the email arrives.

WhatsApp link is a placeholder (`+212600000000`) in `src/App.tsx`; replace it with your business number in international digits. Instagram and TikTok links are also placeholders.

## 4. Edit products and images

Edit the seed rows in the SQL migration before first run, or use Supabase Table Editor on `public.products`. Upload product images to the `product-images` bucket and save their public URLs in `image_url` / `back_image_url`. Product fields include name, slug, description, price (MAD), sizes, colors, stock, active, and featured.

The initial four image URLs are illustrative stock photos, not verified photos of CARTEL garments. Replace them with your actual product photography before taking real orders.

## 5. Publish online

Easy static hosting options: Vercel, Netlify, or Cloudflare Pages.

- Push this project to a private/public Git repository.
- Import it into your hosting provider.
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment variables.
- Deploy and connect your custom domain.

## 6. Before going live

- Replace demo images with accurate front/back product photos.
- Replace WhatsApp, Instagram and TikTok placeholders.
- Configure and test Supabase, admin role restrictions, database webhook, and email.
- Confirm shipping price, free-shipping threshold, sizing, return policy, and legal/privacy wording.
- Add server-side stock validation and decrementing, rate limiting/CAPTCHA for public order submissions, and stronger admin-role RLS. The included starter is a functional first version, not a hardened production commerce platform.

## Notes

- Delivery is set to 35 MAD and free over 600 MAD as an editable demo assumption. Change this in `src/App.tsx`.
- Checkout uses cash on delivery; no online payment provider is configured.
- The crossed emblem is a fictional abstract line-art fashion mark, not a realistic weapon illustration.
