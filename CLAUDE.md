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

---

# STRICT DESIGN GUIDELINES

> **CRITICAL**: All UI changes MUST strictly adhere to these styling guidelines. Do not deviate from the established brand identity. These guidelines are NON-NEGOTIABLE.

## Brand Identity

**Name**: Kōri Matcha (氷 = ice in Japanese)
**Design Philosophy**: Japanese Tea House Minimalism
- **Ma (間)**: Intentional negative space - let elements breathe
- **Wabi-sabi**: Simple elegance, nothing excessive
- **Serenity**: Calm, refined, premium matcha experience

## Color Palette (STRICT - NO EXCEPTIONS)

| Color | Hex | OKLCH | CSS Variable | Usage |
|-------|-----|-------|--------------|-------|
| Primary Green | `#2C5234` | `oklch(0.35 0.08 145)` | `--primary` | Headers, primary buttons, completed status, links |
| Accent Gold | `#C0B561` | `oklch(0.75 0.12 95)` | `--accent` | Secondary CTAs, preparing status, decorative lines |
| Background | Warm white | `oklch(0.985 0.003 90)` | `--background` | Page backgrounds |
| Card | Pure white | `oklch(1 0 0)` | `--card` | Card surfaces |
| Muted | Sage gray | `oklch(0.95 0.008 145)` | `--muted` | Disabled states, backgrounds |

**NEVER USE**: Blue, purple, red (except for errors), or any non-brand colors.

## Typography (STRICT - NO EXCEPTIONS)

| Font | CSS Variable | Usage |
|------|--------------|-------|
| **Cormorant Garamond** | `font-display` | ALL headings, brand name, item names, prices, category titles |
| **Montserrat** | `font-sans` (default) | Body text, descriptions, UI labels, buttons |

**Usage Examples**:
```tsx
// Headings and brand elements - USE font-display CLASS
<h1 className="font-display text-3xl">Kōri Matcha</h1>
<p className="font-display text-xl text-primary">{price}</p>

// Body text uses default (no class needed)
<p className="text-muted-foreground">Description text</p>
```

**NEVER USE**: Inter, Arial, system fonts, or any other typefaces.

## Custom Utility Classes (REQUIRED)

These are defined in `globals.css` and MUST be used:

| Class | Purpose | When to Use |
|-------|---------|-------------|
| `shadow-zen` | Subtle grounded shadow | Default card shadow |
| `shadow-elevated` | Elevated shadow | Hover states, modals |
| `texture-paper` | Subtle paper texture | Full-page backgrounds |
| `animate-fade-up` | Fade + slide up | Page/section entrances |
| `animate-fade-in` | Simple fade | Subtle reveals |
| `animate-scale-in` | Scale + fade | Success states, modals |

**Animation Delays**:
```tsx
// Staggered animations for lists
{items.map((item, index) => (
  <div
    className="animate-fade-up"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    {item}
  </div>
))}
```

## Component Patterns (STRICT)

### Cards
```tsx
// Standard card
<div className="bg-card rounded-xl shadow-zen p-5">

// Card with hover
<div className="bg-card rounded-xl shadow-zen hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300">

// Highlighted card (new orders)
<div className="bg-card rounded-xl shadow-elevated border-2 border-accent/50">
```

### Buttons
| Variant | Usage | Example |
|---------|-------|---------|
| `default` | Primary CTAs | "Checkout", "Sign In", "Complete Order" |
| `accent` | Secondary actions | "Start Preparing", "Add to Cart" |
| `secondary` | Tertiary actions | "Cancel", less prominent actions |
| `outline` | Bordered buttons | "Clear Cart", form cancels |
| `ghost` | Minimal buttons | Icon buttons, subtle actions |

### Headers
```tsx
// Page header (customer-facing)
<header className="bg-primary text-primary-foreground">
  <div className="container mx-auto px-6 py-5">
    <h1 className="text-3xl font-display tracking-tight">Kōri Matcha</h1>
    <p className="text-sm text-primary-foreground/70">氷抹茶 · Premium Japanese Tea</p>
  </div>
</header>

// Admin/merchant header
<header className="bg-primary text-primary-foreground sticky top-0 z-20">
  <div className="container mx-auto px-6 py-4 flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-display">Kōri Matcha</h1>
      <p className="text-sm text-primary-foreground/70">Order Queue</p>
    </div>
    {/* Actions */}
  </div>
</header>
```

### Status Badges
| Status | Variant | Card Treatment |
|--------|---------|----------------|
| New/Paid | `variant="paid"` | `border-2 border-accent/50 shadow-elevated` |
| Preparing | `variant="preparing"` | `shadow-zen` |
| Completed | `variant="completed"` | `opacity-75 shadow-zen` |

### Empty States
```tsx
<div className="text-center py-16 animate-fade-in">
  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
    <span className="text-2xl">茶</span>
  </div>
  <h3 className="text-lg font-display mb-2">No items here</h3>
  <p className="text-sm text-muted-foreground">Description text</p>
</div>
```

### Price Display
```tsx
// Always use display font + primary color
<span className="font-display text-xl text-primary font-medium">
  {formatCurrency(price)}
</span>
```

### Decorative Elements
```tsx
// Gold separator line (use sparingly)
<div className="w-12 h-px bg-accent" />

// Section divider
<div className="pt-4 border-t border-accent/30">
```

## Japanese Branding Elements

Use these consistently:
- **氷** (kōri/ice) - Logo character, login page
- **茶** (cha/tea) - Empty states, placeholders
- **氷抹茶** - Tagline subtitle

## DO's and DON'Ts

### DO:
- Use `font-display` for ALL headings, item names, and prices
- Use `shadow-zen` for cards, `shadow-elevated` for hover states
- Use staggered `animate-fade-up` for list items
- Use `rounded-xl` for cards (not `rounded-lg` or `rounded-2xl`)
- Keep generous padding (p-5, p-6, px-6 py-8)
- Use opacity variants for subtle text (e.g., `text-primary-foreground/70`)

### DON'T:
- Use any font other than Cormorant Garamond or Montserrat
- Use colors outside the brand palette
- Use heavy drop shadows or box shadows
- Add unnecessary decorations, gradients, or effects
- Use emoji except for tea-related kanji (茶, 氷)
- Use default shadcn gray/neutral theme colors
- Overcrowd interfaces - embrace negative space

## File Reference

| File | Contains |
|------|----------|
| `app/globals.css` | Theme colors, custom utilities, animations |
| `app/layout.tsx` | Font imports (Montserrat, Cormorant Garamond) |
| `components/ui/button.tsx` | Button variants including `accent` |
| `components/ui/badge.tsx` | Status badge variants (paid, preparing, completed) |
