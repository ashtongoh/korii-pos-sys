# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Project Overview

Korii Matcha POS System - a self-service Point of Sale for a matcha shop, designed to run on iPads. Built with Next.js 16 (App Router), Supabase, Tailwind CSS, and shadcn/ui.

## Project Status

- **Phase 1-2 Complete**: Foundation, database schema, customer ordering interface
- **Phase 3 Complete**: HitPay PayNow QR integration
- **Pending**: Email payment monitoring, Barista dashboard (`/merchant`), Admin panel (`/admin`)

## Architecture

### Three Interfaces

| Route | Purpose | Status |
|-------|---------|--------|
| `/order` | Customer self-service kiosk (iPad) | Implemented |
| `/merchant` | Barista dashboard - real-time order queue | Not built |
| `/admin` | Menu management, analytics, staff management | Not built |

### Customer Order Flow

1. Browse menu by category → Select items with customizations (size, ice/sugar level, add-ons)
2. Add to cart (React Context, not persisted until checkout)
3. Checkout: Enter initials for order identification
4. Select payment: Cash (instant) or PayNow (QR code)
5. PayNow: HitPay generates QR → Customer scans → Webhook confirms → Supabase Realtime updates UI

### Key Files

**Supabase Clients**:
- `lib/supabase/client.ts` - Browser client (anon key, respects RLS)
- `lib/supabase/server.ts` - Server client + `createServiceClient()` (service role, bypasses RLS)

**HitPay Integration**:
- `lib/hitpay/client.ts` - `createPaymentRequest()`, `verifyWebhookSignature()`
- `app/api/payments/create/route.ts` - Creates payment, returns QR URL
- `app/api/webhooks/hitpay/route.ts` - Receives payment confirmations

**State Management**:
- `contexts/cart-context.tsx` - Shopping cart (items, quantities, customizations)

**Types**:
- `lib/types/database.types.ts` - Supabase table types
- `lib/types/index.ts` - Extended types with relations (e.g., `ItemWithCustomizations`, `OrderWithItems`)

### Database Schema

Tables in `supabase/schema.sql`:

- `categories`, `items` - Menu structure
- `customization_groups`, `customization_options`, `item_customization_groups` - Item customizations
- `orders` - Status: pending → paid → preparing → completed → cancelled
- `order_items` - Line items with `customizations_json` (JSONB)
- `payment_sessions` - Payment state, HitPay IDs (`hitpay_payment_id`), QR URLs
- `admin_users` - Staff with roles (admin/barista)

Row Level Security (RLS) enabled on all tables. Public can view menu and create orders; authenticated users manage orders.

### Payment Tracking

Dual-ID approach for reliability:
- `reference_number` = our `session_id` (sent to HitPay, returned in webhook)
- `hitpay_payment_id` = HitPay's ID (stored for audit/debugging)

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
HITPAY_API_KEY
HITPAY_SALT
HITPAY_API_URL              # https://api.sandbox.hit-pay.com or https://api.hit-pay.com
NEXT_PUBLIC_APP_URL         # For webhook URL (use ngrok URL for local testing)
```

## Local Webhook Testing

```bash
ngrok http 3000
# Update NEXT_PUBLIC_APP_URL in .env.local with ngrok URL
# Configure webhook in HitPay dashboard: {ngrok-url}/api/webhooks/hitpay
```

## Design Decisions

- **React Context over Zustand**: Sufficient for cart state, no extra dependencies
- **Supabase**: All-in-one (DB, Auth, Realtime), RLS for security, no separate backend
- **Customers identified by initials**: Simple identification for calling out orders (no accounts required)
