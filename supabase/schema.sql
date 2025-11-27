-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customization groups table (e.g., "Size", "Ice Level", "Sugar Level")
CREATE TABLE customization_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'multiple')),
  required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customization options table (e.g., "Large +$1", "No Ice", "50% Sugar")
CREATE TABLE customization_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES customization_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_modifier DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction table: which items have which customization groups
CREATE TABLE item_customization_groups (
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES customization_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (item_id, group_id)
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL UNIQUE,
  customer_initials TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'preparing', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'paynow')),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Order items table (items in each order)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  customizations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_total DECIMAL(10, 2) NOT NULL CHECK (item_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment sessions table (tracks PayNow QR codes and payment status)
CREATE TABLE payment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  qr_data TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'expired', 'failed')) DEFAULT 'pending',
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- HitPay integration fields
  hitpay_payment_id TEXT,
  hitpay_url TEXT,
  qr_code_url TEXT
);

-- Admin users table (Supabase Auth integration)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'barista')) DEFAULT 'barista',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_items_available ON items(available);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_payment_sessions_session_id ON payment_sessions(session_id);
CREATE INDEX idx_payment_sessions_status ON payment_sessions(status);
CREATE INDEX idx_payment_sessions_expires_at ON payment_sessions(expires_at);
CREATE INDEX idx_payment_sessions_hitpay_id ON payment_sessions(hitpay_payment_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customization_groups_updated_at BEFORE UPDATE ON customization_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customization_options_updated_at BEFORE UPDATE ON customization_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_customization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public read access to menu data (categories, items, customizations)
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public can view items" ON items FOR SELECT USING (true);
CREATE POLICY "Public can view customization groups" ON customization_groups FOR SELECT USING (true);
CREATE POLICY "Public can view customization options" ON customization_options FOR SELECT USING (true);
CREATE POLICY "Public can view item customization groups" ON item_customization_groups FOR SELECT USING (true);

-- Public can create orders and order items (customer iPad)
CREATE POLICY "Public can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view own orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public can update own orders" ON orders FOR UPDATE USING (true);

CREATE POLICY "Public can insert order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view order items" ON order_items FOR SELECT USING (true);

-- Public can create and view payment sessions
CREATE POLICY "Public can insert payment sessions" ON payment_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view payment sessions" ON payment_sessions FOR SELECT USING (true);
CREATE POLICY "Public can update payment sessions" ON payment_sessions FOR UPDATE USING (true);

-- Admin/Barista policies
CREATE POLICY "Authenticated can view admin users" ON admin_users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage items" ON items
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage customization groups" ON customization_groups
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage customization options" ON customization_options
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage item customization groups" ON item_customization_groups
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Authenticated users (baristas/admins) can update order status
CREATE POLICY "Authenticated can update orders" ON orders
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- Insert default admin user function (to be called after setup)
CREATE OR REPLACE FUNCTION create_admin_user(user_id UUID, user_email TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_users (id, email, role)
  VALUES (user_id, user_email, 'admin')
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
