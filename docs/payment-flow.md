# Payment Flow Documentation

## Overview

This document outlines the complete PayNow payment flow for the Korii POS system, including all API requests, responses, and database operations.

---

## Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Customer  │     │  Next.js    │     │   HitPay    │     │  Supabase   │
│   (iPad)    │     │   Server    │     │    API      │     │  Database   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ 1. Select items   │                   │                   │
       │   & checkout      │                   │                   │
       │──────────────────>│                   │                   │
       │                   │                   │                   │
       │                   │ 2. Create order   │                   │
       │                   │───────────────────────────────────────>│
       │                   │                   │                   │
       │                   │ 3. Create payment │                   │
       │                   │   session         │                   │
       │                   │───────────────────────────────────────>│
       │                   │                   │                   │
       │                   │ 4. Create payment │                   │
       │                   │   request         │                   │
       │                   │──────────────────>│                   │
       │                   │                   │                   │
       │                   │ 5. Return QR URL  │                   │
       │                   │<──────────────────│                   │
       │                   │                   │                   │
       │ 6. Display QR     │                   │                   │
       │<──────────────────│                   │                   │
       │                   │                   │                   │
       │ 7. Customer scans │                   │                   │
       │   & pays via      │                   │                   │
       │   banking app     │                   │                   │
       │──────────────────────────────────────>│                   │
       │                   │                   │                   │
       │                   │ 8. Webhook:       │                   │
       │                   │   payment success │                   │
       │                   │<──────────────────│                   │
       │                   │                   │                   │
       │                   │ 9. Update payment │                   │
       │                   │   session status  │                   │
       │                   │───────────────────────────────────────>│
       │                   │                   │                   │
       │                   │ 10. Update order  │                   │
       │                   │    status to paid │                   │
       │                   │───────────────────────────────────────>│
       │                   │                   │                   │
       │ 11. Poll detects  │                   │                   │
       │    confirmed      │                   │                   │
       │<──────────────────────────────────────────────────────────│
       │                   │                   │                   │
       │ 12. Show success  │                   │                   │
       │                   │                   │                   │
```

---

## Step-by-Step Details

### Step 1-3: Customer Initiates Payment

**Location:** `app/order/payment/page.tsx`

When customer selects PayNow and proceeds to payment:

**Database: Create Order**
```sql
INSERT INTO orders (session_id, customer_initials, payment_method, total_amount, status)
VALUES ('uuid-session-id', 'JD', 'paynow', 16.50, 'pending')
RETURNING *;
```

**Response:**
```json
{
  "id": "order-uuid",
  "session_id": "e692df51-1e95-4c85-9c02-6fc78225085b",
  "customer_initials": "JD",
  "payment_method": "paynow",
  "total_amount": 16.50,
  "status": "pending",
  "created_at": "2025-11-28T02:17:22Z"
}
```

**Database: Create Order Items**
```sql
INSERT INTO order_items (order_id, item_id, quantity, customizations_json, item_total)
VALUES
  ('order-uuid', 'item-uuid-1', 2, '[{"group_name":"Size","option_name":"Large"}]', 12.00),
  ('order-uuid', 'item-uuid-2', 1, '[]', 4.50);
```

**Database: Create Payment Session**
```sql
INSERT INTO payment_sessions (session_id, order_id, qr_data, amount, expires_at)
VALUES ('e692df51-1e95-4c85-9c02-6fc78225085b', 'order-uuid', 'pending_hitpay', 16.50, '2025-11-28T02:32:22Z')
RETURNING *;
```

---

### Step 4-5: Create HitPay Payment Request

**Location:** `app/api/payments/create/route.ts` → `lib/hitpay/client.ts`

**API Request to HitPay:**
```
POST https://api.sandbox.hit-pay.com/v1/payment-requests
Headers:
  Content-Type: application/json
  X-BUSINESS-API-KEY: your-api-key
  X-Requested-With: XMLHttpRequest

Body:
{
  "amount": 16.50,
  "currency": "SGD",
  "payment_methods": ["paynow_online"],
  "generate_qr": true,
  "reference_number": "e692df51-1e95-4c85-9c02-6fc78225085b",
  "name": "JD",
  "webhook": "https://your-ngrok-url.ngrok.io/api/webhooks/hitpay",
  "send_email": "false",
  "send_sms": "false"
}
```

**HitPay Response:**
```json
{
  "id": "a0758d6b-eb85-443e-9a47-c3aec93c8cb8",
  "name": "JD",
  "email": null,
  "phone": null,
  "amount": "16.50",
  "currency": "sgd",
  "status": "pending",
  "purpose": null,
  "reference_number": "e692df51-1e95-4c85-9c02-6fc78225085b",
  "payment_methods": ["paynow_online"],
  "url": "https://securecheckout.sandbox.hit-pay.com/payment-request/@korii/a0758d6b-eb85-443e-9a47-c3aec93c8cb8",
  "redirect_url": null,
  "webhook": "https://your-ngrok-url.ngrok.io/api/webhooks/hitpay",
  "send_sms": false,
  "send_email": false,
  "sms_status": "pending",
  "email_status": "pending",
  "allow_repeated_payments": false,
  "expiry_date": null,
  "created_at": "2025-11-28T02:17:22",
  "updated_at": "2025-11-28T02:17:22"
}
```

**Note:** HitPay sandbox does NOT return a QR code image. We generate it ourselves using the `qrcode` library from the `url` field.

**Database: Update Payment Session with HitPay ID**
```sql
UPDATE payment_sessions
SET hitpay_payment_id = 'a0758d6b-eb85-443e-9a47-c3aec93c8cb8',
    hitpay_url = 'https://securecheckout.sandbox.hit-pay.com/...',
    qr_code_url = 'data:image/png;base64,...'
WHERE session_id = 'e692df51-1e95-4c85-9c02-6fc78225085b';
```

**Response to Frontend:**
```json
{
  "success": true,
  "hitpay_payment_id": "a0758d6b-eb85-443e-9a47-c3aec93c8cb8",
  "hitpay_url": "https://securecheckout.sandbox.hit-pay.com/...",
  "qr_code_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "expires_at": "2025-11-28T02:32:22Z"
}
```

---

### Step 6: Display QR Code

**Location:** `app/order/payment/page.tsx`

The frontend displays:
- Generated QR code (base64 data URL)
- Payment amount
- Instructions to scan with banking app
- Polling starts (every 3 seconds) to check payment status

---

### Step 7: Customer Pays

Customer scans QR code with their banking app (DBS, OCBC, etc.) and completes the PayNow payment.

---

### Step 8: HitPay Webhook

**Location:** `app/api/webhooks/hitpay/route.ts`

HitPay sends a POST request to our webhook URL:

**Webhook Request from HitPay:**
```
POST /api/webhooks/hitpay
Content-Type: application/json

{
  "id": "a0758d6b-fb29-4a08-8440-48272adb3c9c",
  "business_id": "a0266285-a0fc-4884-9ec6-9d64a7ed4644",
  "channel": "payment_gateway",
  "status": "succeeded",
  "currency": "sgd",
  "amount": "16.5",
  "payment_request_id": "a0758d6b-eb85-443e-9a47-c3aec93c8cb8",
  "created_at": "2025-11-28T02:17:22+08:00",
  "updated_at": "2025-11-28T02:17:35+08:00",
  "closed_at": "2025-11-28T02:17:33+08:00",
  ...
}
```

**Key Fields:**
| Field | Description |
|-------|-------------|
| `status` | `succeeded` = payment completed |
| `payment_request_id` | The HitPay payment ID we stored earlier |
| `amount` | Payment amount |

---

### Step 9-10: Update Database

**Location:** `app/api/webhooks/hitpay/route.ts`

**Lookup Payment Session:**
```sql
SELECT id, order_id, status, session_id
FROM payment_sessions
WHERE hitpay_payment_id = 'a0758d6b-eb85-443e-9a47-c3aec93c8cb8';
```

**Update Payment Session:**
```sql
UPDATE payment_sessions
SET status = 'confirmed',
    confirmed_at = '2025-11-28T02:17:35Z',
    hitpay_payment_id = 'a0758d6b-eb85-443e-9a47-c3aec93c8cb8'
WHERE id = 'payment-session-uuid';
```

**Update Order Status:**
```sql
UPDATE orders
SET status = 'paid'
WHERE id = 'order-uuid';
```

**Webhook Response:**
```json
{
  "received": true,
  "session_id": "e692df51-1e95-4c85-9c02-6fc78225085b",
  "status": "confirmed"
}
```

---

### Step 11: Frontend Detects Payment

**Location:** `app/order/payment/page.tsx`

**Polling Request (every 3 seconds):**
```sql
SELECT status
FROM payment_sessions
WHERE session_id = 'e692df51-1e95-4c85-9c02-6fc78225085b';
```

**Response:**
```json
{
  "status": "confirmed"
}
```

When `status === 'confirmed'`, the frontend:
1. Clears the cart
2. Shows success message
3. Starts 10-second countdown
4. Redirects to `/order`

---

## Database Schema Summary

### orders
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | TEXT | Unique session identifier |
| customer_initials | TEXT | Customer identifier (e.g., "JD") |
| status | TEXT | `pending` → `paid` → `preparing` → `completed` |
| payment_method | TEXT | `cash` or `paynow` |
| total_amount | DECIMAL | Order total |
| created_at | TIMESTAMP | Order creation time |
| completed_at | TIMESTAMP | When order was completed |

### payment_sessions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | TEXT | Links to order.session_id |
| order_id | UUID | FK to orders.id |
| status | TEXT | `pending` → `confirmed` / `expired` / `failed` |
| amount | DECIMAL | Payment amount |
| hitpay_payment_id | TEXT | HitPay's payment request ID |
| hitpay_url | TEXT | HitPay checkout URL |
| qr_code_url | TEXT | Generated QR code (base64) |
| expires_at | TIMESTAMP | Payment expiry time |
| confirmed_at | TIMESTAMP | When payment was confirmed |

---

## Error Handling

### HitPay API Errors
- Invalid API key → 401 error
- Validation errors → 422 with error details
- Rate limiting → 429, retry after delay

### Webhook Failures
- Invalid signature → 401 (if HMAC enabled)
- Payment session not found → 404
- Database update failed → 500

### Frontend Handling
- Network errors → Show retry button
- Payment timeout → Show expiry message
- Polling errors → Continue polling, log errors

---

## Testing Checklist

1. ✅ QR code displays correctly
2. ✅ Webhook receives payment confirmation
3. ✅ Payment session updated to `confirmed`
4. ✅ Order status updated to `paid`
5. ✅ Frontend detects payment via polling
6. ✅ Success screen displays
7. ✅ Order appears in merchant dashboard
