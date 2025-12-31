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
- **Phase 4 Complete**: Brand styling applied across all interfaces
- **Phase 5 Complete**: Admin authentication, Admin panel (`/admin`), Menu management

## Architecture

### Three Interfaces

| Route | Purpose | Status |
|-------|---------|--------|
| `/order` | Customer self-service kiosk (iPad) | Implemented |
| `/merchant` | Barista dashboard - real-time order queue | Implemented (auth protected) |
| `/admin` | Menu management, analytics, staff management | Implemented (admin only) |
| `/login` | Staff authentication | Implemented |

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

### PayNow Payment Flow

```
Customer selects PayNow → Order created (status: pending)
    ↓
/api/payments/create calls HitPay API
    ↓
HitPay returns payment_request_id + raw PayNow QR string
    ↓
QR code generated from raw string using `qrcode` library
    ↓
Frontend displays QR + subscribes to Supabase Realtime
    ↓
Customer scans QR with banking app and pays
    ↓
HitPay sends webhook POST to /api/webhooks/hitpay
    ↓
Webhook verifies HMAC, updates DB (status: confirmed/paid)
    ↓
Supabase Realtime notifies frontend → Success screen
```

**Two communication channels:**
- **Webhook (HitPay → Server)**: HitPay notifies your server when payment completes. Uses ngrok in dev for public URL.
- **Supabase Realtime (Server → Frontend)**: Database changes broadcast to browser via WebSocket. Frontend updates instantly.

**QR Code handling**: HitPay production returns raw PayNow EMV strings (e.g., `00020101...`), not image URLs. The `lib/hitpay/client.ts` detects this and generates a base64 PNG using the `qrcode` library.

**Frontend detection**: Dual mechanism for reliability:
1. Supabase Realtime subscription (instant)
2. Polling fallback every 3 seconds (if Realtime fails)

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

## Brand Styling Guidelines

> **IMPORTANT**: All UI changes MUST strictly adhere to these styling guidelines. Do not deviate from the established brand identity, colors, or typography.

### Brand Identity

**Name**: Kōri Matcha (氷 = ice in Japanese)
**Philosophy**: Minimalist, Japanese-inspired, freshness, clarity, calm

### Color Palette (STRICT)

| Color | Hex | OKLCH | Usage |
|-------|-----|-------|-------|
| Primary Green | `#2C5234` | `oklch(0.35 0.08 145)` | Headers, primary buttons, links, completed status |
| Accent Gold | `#C0B561` | `oklch(0.75 0.12 95)` | Secondary CTAs, highlights, preparing status |
| Black | `#000000` | - | Text |
| White | `#FFFFFF` | - | Backgrounds, button text on primary |

**DO NOT** use other colors (e.g., blue, red for non-error states). All UI elements must use these brand colors.

### Typography (STRICT)

| Font | Variable | Usage |
|------|----------|-------|
| **Cormorant Garamond** | `--font-display` | ALL headings, brand name, item names, prices |
| **Montserrat** | `--font-montserrat` | Body text, descriptions, UI labels |

**Usage**:
```tsx
// For headings and brand elements
className="font-[family-name:var(--font-display)]"

// Body text uses default (Montserrat via font-sans)
```

**DO NOT** use other fonts or the default Inter font.

### Component Variants (STRICT)

**Button Variants**:
- `default` - Primary green (main CTAs: "Checkout", "Complete Order", "Sign In")
- `accent` - Gold (secondary actions: "Add to Cart", "Start Preparing", "Refresh")
- `secondary` - Light sage background (tertiary actions)
- `outline` - Bordered, transparent background
- `ghost` - No background, hover state only
- `destructive` - Red, for delete/cancel actions only

**Badge Variants**:
- `paid` - Light green background, for new orders
- `preparing` - Gold background, for in-progress orders
- `completed` - Primary green background, for done orders
- `pending` - Muted gray, for awaiting states

### Header Pattern (REQUIRED)

All page interfaces MUST use this branded header:

```tsx
<header className="bg-primary text-primary-foreground">
  <div className="container mx-auto px-4 py-4">
    <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">Kōri Matcha</h1>
    <p className="text-sm text-primary-foreground/80">Subtitle here</p>
  </div>
</header>
```

### Status Colors (STRICT)

| Status | Badge Variant | Card Border | Button |
|--------|--------------|-------------|--------|
| New/Paid | `paid` | `border-accent` | `variant="accent"` |
| Preparing | `preparing` | - | - |
| Completed | `completed` | - | `variant="default"` |

### Card Styling

Cards use `rounded-2xl` with subtle borders (`border-border/50`). Do not use sharp corners or heavy shadows.

### Price Display

Prices should always use:
- Primary green color: `text-primary`
- Display font: `font-[family-name:var(--font-display)]`
- Bold weight: `font-bold`

### Dos and Don'ts

**DO**:
- Use forest green (`bg-primary`) for all headers
- Use gold (`variant="accent"`) for secondary actions
- Use display font for all headings and item names
- Keep UI minimal and clean

**DON'T**:
- Use blue, purple, or other non-brand colors
- Use default shadcn gray theme
- Add unnecessary decorations or gradients
- Use fonts other than Cormorant Garamond and Montserrat
