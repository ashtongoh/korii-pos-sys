# Korii Matcha POS System

A modern Point of Sale system built with Next.js 16, designed specifically for Korii Matcha shop.

## 🚀 Project Status

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Next.js 16 with TypeScript and App Router
- [x] Supabase integration (database, auth, realtime)
- [x] Database schema with RLS policies
- [x] PWA configuration for iPad
- [x] React Context for cart management
- [x] Type definitions and utility functions

### ✅ Phase 2: Customer Ordering Interface (COMPLETED)
- [x] Menu display with categories
- [x] Item cards with images
- [x] Item customization modal (sizes, ice/sugar levels, add-ons)
- [x] Shopping cart with real-time updates
- [x] Checkout flow (initials entry → payment selection)
- [x] Payment confirmation page (PayNow QR placeholder + Cash)
- [x] Real-time payment confirmation listener

### 🔄 Phase 3: PayNow Integration (NEXT)
- [ ] Implement actual PayNow QR code generation
- [ ] Session management
- [ ] Payment status tracking

### 📋 Phase 4: Email Payment Monitoring (PENDING)
- [ ] Gmail API integration
- [ ] Outlook/Microsoft Graph API integration
- [ ] Email parsing for payment notifications
- [ ] Payment matching logic

### 📋 Phase 5: Barista Dashboard (PENDING)
- [ ] Authentication for baristas
- [ ] Real-time order queue
- [ ] Order status management (preparing, completed)
- [ ] Sound/visual notifications

### 📋 Phase 6: Admin Panel (PENDING)
- [ ] Admin authentication
- [ ] Menu management (categories, items, customizations)
- [ ] Order history
- [ ] Transaction history
- [ ] Sales analytics dashboard
- [ ] Staff management

### 📋 Phase 7: Polish & Optimization (PENDING)
- [ ] iPad-specific optimizations
- [ ] Loading states and error handling
- [ ] Performance optimization
- [ ] Production testing

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **State Management**: React Context API
- **Charts**: Recharts (for analytics)

## 📦 Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase/schema.sql`
   - Follow instructions in `supabase/README.md`

3. **Configure environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   Then fill in your Supabase credentials and other configuration.

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   - Customer iPad: `http://localhost:3000/order`
   - Merchant Dashboard: `http://localhost:3000/merchant` (coming soon)
   - Admin Panel: `http://localhost:3000/admin` (coming soon)

## 📱 System Components

### 1. Customer Ordering Interface (`/order`)
- **Purpose**: Self-service kiosk for customers to place orders
- **Features**:
  - Browse menu by category
  - Select items with customizations
  - View cart and edit items
  - Enter initials for order identification
  - Pay with Cash or PayNow QR

### 2. Barista Dashboard (`/merchant`) - Coming Soon
- **Purpose**: For staff to view and manage incoming orders
- **Features**:
  - Real-time order queue
  - Mark orders as preparing/completed
  - View order details and customizations
  - Notifications for new orders

### 3. Admin Panel (`/admin`) - Coming Soon
- **Purpose**: Back-office management for menu and business data
- **Features**:
  - Menu management (items, categories, customizations)
  - Order and transaction history
  - Sales analytics
  - Staff account management

## 🗂️ Project Structure

```
korii-pos-sys/
├── app/                      # Next.js App Router pages
│   ├── order/               # Customer ordering interface
│   │   ├── checkout/        # Checkout flow
│   │   └── payment/         # Payment confirmation
│   ├── merchant/            # Barista dashboard (coming soon)
│   └── admin/               # Admin panel (coming soon)
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   └── order/               # Order-specific components
├── contexts/                # React Context providers
│   └── cart-context.tsx    # Shopping cart state
├── lib/                     # Utilities and helpers
│   ├── supabase/           # Supabase client configuration
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── supabase/               # Database schema and docs
│   ├── schema.sql          # PostgreSQL schema
│   └── README.md           # Setup instructions
└── public/                 # Static assets
```

## 🎨 Design Decisions

### Why React Context instead of Zustand?
- **Simplicity**: For this relatively simple app, React Context is sufficient
- **No extra dependencies**: Keeps the bundle size smaller
- **Native React**: Uses built-in React features

### Why Supabase?
- **All-in-one**: Database, Auth, Realtime, Storage in one platform
- **Real-time subscriptions**: Perfect for order updates to barista dashboard
- **Row Level Security**: Built-in security at database level
- **Easy deployment**: No separate backend to deploy

### Why Next.js 16?
- **App Router**: Better performance with Server Components
- **Built-in optimization**: Image optimization, font optimization
- **API routes**: Easy to add backend endpoints
- **PWA support**: Great for iPad kiosk setup

## 🔐 Security Notes

- Row Level Security (RLS) enabled on all tables
- Public can only create orders and view menu
- Authenticated users (baristas/admins) can manage orders
- Service role key should never be exposed to client
- All sensitive operations use server-side API routes

## 📝 Next Steps

1. **Set up Supabase**: Follow `supabase/README.md` to create your database
2. **Add menu items**: Use Supabase dashboard or wait for admin panel
3. **Implement PayNow QR**: Provide your PayNow QR generation code
4. **Set up email monitoring**: Configure Gmail/Outlook API access
5. **Build barista dashboard**: Next major feature
6. **Build admin panel**: For menu and business management
7. **Test on actual iPads**: Ensure touch interactions work well

## 🐛 Known Issues / TODOs

- PayNow QR code generation is a placeholder (awaiting your code)
- Email monitoring not yet implemented
- Temporary auto-confirmation after 10 seconds for testing
- PWA icons need to be generated
- No barista dashboard yet
- No admin panel yet

## 📞 Support

For questions or issues, refer to the project documentation or create an issue.

---

Built with ❤️ for Korii Matcha
