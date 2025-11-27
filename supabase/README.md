# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to be provisioned

## 2. Run the Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `schema.sql`
3. Paste and execute it in the SQL Editor

## 3. Get Your API Keys

1. Go to Project Settings > API
2. Copy your project URL
3. Copy your `anon` public key
4. Copy your `service_role` secret key (keep this secure!)

## 4. Update Environment Variables

Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 5. Create First Admin User

1. Go to Authentication in your Supabase dashboard
2. Create a new user with your admin email
3. Copy the user's UUID
4. Go to SQL Editor and run:

```sql
SELECT create_admin_user(
  'paste-user-uuid-here'::UUID,
  'your-admin-email@example.com'
);
```

## 6. Enable Realtime

For the barista dashboard to receive live order updates:

1. Go to Database > Replication in Supabase dashboard
2. Enable replication for these tables:
   - `orders`
   - `order_items`
   - `payment_sessions`

## 7. Storage Setup (Optional - for menu images)

1. Go to Storage in Supabase dashboard
2. Create a new bucket called `menu-images`
3. Set it to public
4. Add RLS policies:
   - Public: SELECT (anyone can view)
   - Admin only: INSERT, UPDATE, DELETE

## Database Schema Overview

### Tables

- **categories**: Menu categories (e.g., "Drinks", "Food")
- **items**: Menu items with prices
- **customization_groups**: Groups of customizations (e.g., "Size", "Ice Level")
- **customization_options**: Options within groups (e.g., "Large +$1")
- **item_customization_groups**: Links items to their available customizations
- **orders**: Customer orders with status tracking
- **order_items**: Individual items in an order
- **payment_sessions**: PayNow payment tracking
- **admin_users**: Admin/barista accounts

### Order Status Flow

1. `pending` - Order created, waiting for payment
2. `paid` - Payment confirmed
3. `preparing` - Barista started preparing
4. `completed` - Order ready/delivered
5. `cancelled` - Order cancelled (future use)

### Payment Session Status Flow

1. `pending` - QR code generated, waiting for payment
2. `confirmed` - Payment received and verified
3. `expired` - Session timed out
4. `failed` - Payment failed
