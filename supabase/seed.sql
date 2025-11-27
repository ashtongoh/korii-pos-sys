-- Seed data for Korii POS System
-- Run this script in Supabase SQL Editor to populate test data

-- Clear existing data (in correct order to respect foreign keys)
DELETE FROM item_customization_groups;
DELETE FROM customization_options;
DELETE FROM customization_groups;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM payment_sessions;
DELETE FROM items;
DELETE FROM categories;

-- Insert Categories
INSERT INTO categories (id, name, display_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Drinks', 1),
  ('22222222-2222-2222-2222-222222222222', 'Food', 2);

-- Insert Items
INSERT INTO items (id, category_id, name, description, base_price, available) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Matcha Latte', 'Creamy matcha latte made with premium matcha', 5.00, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Hojicha Latte', 'Roasted green tea latte with a nutty flavor', 5.50, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Matcha Cookie', 'Soft-baked matcha flavored cookie', 3.00, true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Brownie', 'Rich chocolate brownie', 4.00, true);

-- Insert Customization Groups
INSERT INTO customization_groups (id, name, type, required) VALUES
  ('11110000-0000-0000-0000-000000000001', 'Size', 'single', true),
  ('11110000-0000-0000-0000-000000000002', 'Ice Level', 'single', false),
  ('11110000-0000-0000-0000-000000000003', 'Sugar Level', 'single', false);

-- Insert Customization Options
-- Size options
INSERT INTO customization_options (id, group_id, name, price_modifier) VALUES
  ('22220000-0000-0000-0000-000000000001', '11110000-0000-0000-0000-000000000001', 'Small', -0.50),
  ('22220000-0000-0000-0000-000000000002', '11110000-0000-0000-0000-000000000001', 'Regular', 0.00),
  ('22220000-0000-0000-0000-000000000003', '11110000-0000-0000-0000-000000000001', 'Large', 1.00);

-- Ice Level options
INSERT INTO customization_options (id, group_id, name, price_modifier) VALUES
  ('22220000-0000-0000-0000-000000000004', '11110000-0000-0000-0000-000000000002', 'No Ice', 0.00),
  ('22220000-0000-0000-0000-000000000005', '11110000-0000-0000-0000-000000000002', 'Less Ice', 0.00),
  ('22220000-0000-0000-0000-000000000006', '11110000-0000-0000-0000-000000000002', 'Normal Ice', 0.00);

-- Sugar Level options
INSERT INTO customization_options (id, group_id, name, price_modifier) VALUES
  ('22220000-0000-0000-0000-000000000007', '11110000-0000-0000-0000-000000000003', '0% Sugar', 0.00),
  ('22220000-0000-0000-0000-000000000008', '11110000-0000-0000-0000-000000000003', '50% Sugar', 0.00),
  ('22220000-0000-0000-0000-000000000009', '11110000-0000-0000-0000-000000000003', '100% Sugar', 0.00);

-- Link customization groups to drink items only
INSERT INTO item_customization_groups (item_id, group_id) VALUES
  -- Matcha Latte customizations
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11110000-0000-0000-0000-000000000001'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11110000-0000-0000-0000-000000000002'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11110000-0000-0000-0000-000000000003'),
  -- Hojicha Latte customizations
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11110000-0000-0000-0000-000000000001'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11110000-0000-0000-0000-000000000002'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11110000-0000-0000-0000-000000000003');
