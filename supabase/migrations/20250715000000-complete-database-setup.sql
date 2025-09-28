-- =====================================================
-- COMPLETE DATABASE SETUP FOR SUBSCRIPTION TRACKER DASHBOARD
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('Basic', 'Premium', 'Enterprise', 'Starter', 'Standard', 'Professional')),
  subscription_start_date DATE NOT NULL,
  subscription_end_date DATE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- REVENUE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SUBSCRIPTION PLANS TABLE (for reference)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  features JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- INSERT DEFAULT SUBSCRIPTION PLANS (UPDATED WITH NEW PLANS)
-- =====================================================
INSERT INTO public.subscription_plans (name, price, description, features) VALUES
  ('Basic', 2000.00, 'Basic website subscription plan', '["Basic website", "Email support", "Monthly updates"]'),
  ('Premium', 3500.00, 'Premium website subscription plan', '["Premium website", "Priority support", "Weekly updates", "SEO optimization"]'),
  ('Enterprise', 5000.00, 'Enterprise website subscription plan', '["Enterprise website", "24/7 support", "Daily updates", "Advanced SEO", "Analytics dashboard"]'),
  ('Starter', 800.00, 'Starter website subscription plan', '["Simple website", "Basic support", "Quarterly updates"]'),
  ('Standard', 1000.00, 'Standard website subscription plan', '["Standard website", "Email support", "Monthly updates", "Basic SEO"]'),
  ('Professional', 1500.00, 'Professional website subscription plan', '["Professional website", "Priority support", "Bi-weekly updates", "SEO optimization", "Performance monitoring"]')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_subscription_type ON public.customers(subscription_type);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON public.customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_subscription_start_date ON public.customers(subscription_start_date);
CREATE INDEX IF NOT EXISTS idx_customers_subscription_end_date ON public.customers(subscription_end_date);

CREATE INDEX IF NOT EXISTS idx_revenue_date ON public.revenue(date);
CREATE INDEX IF NOT EXISTS idx_revenue_amount ON public.revenue(amount);
CREATE INDEX IF NOT EXISTS idx_revenue_created_at ON public.revenue(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES (DROP EXISTING FIRST TO AVOID CONFLICTS)
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations on revenue" ON public.revenue;
DROP POLICY IF EXISTS "Allow read access to subscription plans" ON public.subscription_plans;

-- Create new policies
CREATE POLICY "Allow all operations on customers" ON public.customers 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on revenue" ON public.revenue 
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access to subscription plans" ON public.subscription_plans 
  FOR SELECT USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================
-- Function to update timestamps automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate subscription end date (30 days from start)
CREATE OR REPLACE FUNCTION public.calculate_subscription_end_date(start_date DATE)
RETURNS DATE AS $$
BEGIN
  RETURN start_date + INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to check if subscription is expired
CREATE OR REPLACE FUNCTION public.is_subscription_expired(subscription_end_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN subscription_end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to get days until subscription expires
CREATE OR REPLACE FUNCTION public.days_until_expiry(subscription_end_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN GREATEST(0, (subscription_end_date - CURRENT_DATE));
END;
$$ LANGUAGE plpgsql;

-- Function for the subscription end date trigger
CREATE OR REPLACE FUNCTION public.set_subscription_end_date_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_end_date IS NULL OR (TG_OP = 'UPDATE' AND NEW.subscription_end_date = OLD.subscription_end_date) THEN
    NEW.subscription_end_date = NEW.subscription_start_date + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS (DROP EXISTING FIRST TO AVOID CONFLICTS)
-- =====================================================
-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
DROP TRIGGER IF EXISTS set_subscription_end_date ON public.customers;

-- Create new triggers
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_subscription_end_date
  BEFORE INSERT OR UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_subscription_end_date_trigger();

-- =====================================================
-- VIEWS FOR REPORTING (DROP EXISTING FIRST)
-- =====================================================
-- Drop existing views if they exist
DROP VIEW IF EXISTS public.active_customers;
DROP VIEW IF EXISTS public.revenue_summary;

-- Create new views
CREATE VIEW public.active_customers AS
SELECT 
  id,
  name,
  phone,
  subscription_type,
  subscription_start_date,
  subscription_end_date,
  price,
  public.days_until_expiry(subscription_end_date) as days_remaining,
  public.is_subscription_expired(subscription_end_date) as is_expired
FROM public.customers 
WHERE is_active = true;

CREATE VIEW public.revenue_summary AS
SELECT 
  DATE_TRUNC('month', date) as month,
  COUNT(*) as transactions,
  SUM(amount) as total_revenue,
  AVG(amount) as average_amount
FROM public.revenue 
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- =====================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================
-- Insert sample customer if table is empty
INSERT INTO public.customers (name, phone, whatsapp, subscription_type, subscription_start_date, subscription_end_date, price, is_active)
SELECT 
  'Sample Business Ltd',
  '+254700000000',
  '+254700000000',
  'Basic',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  2000.00,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.customers LIMIT 1);

-- Insert sample revenue if table is empty
INSERT INTO public.revenue (amount, date, description)
SELECT 
  2000.00,
  CURRENT_DATE,
  'Sample subscription payment'
WHERE NOT EXISTS (SELECT 1 FROM public.revenue LIMIT 1);

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================
-- Grant access to authenticated users (if using Supabase Auth)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Grant access to new tables/views
GRANT ALL ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.active_customers TO anon, authenticated;
GRANT ALL ON public.revenue_summary TO anon, authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration sets up the complete database structure for the subscription tracker dashboard
-- Tables: customers, revenue, subscription_plans
-- Functions: update_updated_at_column, calculate_subscription_end_date, is_subscription_expired, days_until_expiry
-- Triggers: Automatic timestamp updates, subscription end date calculation
-- Views: active_customers, revenue_summary
-- Policies: Row Level Security enabled with appropriate access policies
-- Updated subscription plans: Basic(2000), Premium(3500), Enterprise(5000), Starter(800), Standard(1000), Professional(1500)
