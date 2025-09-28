-- =====================================================
-- ADD WEBSITE MANAGEMENT AND KILL SWITCH FUNCTIONALITY
-- =====================================================

-- Add website URL, kill switch, and custom pricing fields to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS unblocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS custom_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS use_custom_price BOOLEAN NOT NULL DEFAULT false;

-- Create websites table for managing client websites
CREATE TABLE IF NOT EXISTS public.websites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'maintenance')),
  blocked_reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE,
  unblocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_websites_customer_id ON public.websites(customer_id);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON public.websites(domain);
CREATE INDEX IF NOT EXISTS idx_websites_status ON public.websites(status);
CREATE INDEX IF NOT EXISTS idx_customers_is_blocked ON public.customers(is_blocked);
CREATE INDEX IF NOT EXISTS idx_customers_website_url ON public.customers(website_url);

-- Enable RLS on websites table
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for websites
CREATE POLICY "Allow all operations on websites" ON public.websites 
  FOR ALL USING (true) WITH CHECK (true);

-- Create function to block/unblock websites
CREATE OR REPLACE FUNCTION public.block_website(
  p_customer_id UUID,
  p_reason TEXT DEFAULT 'Payment overdue'
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update customer record
  UPDATE public.customers 
  SET 
    is_blocked = true,
    blocked_reason = p_reason,
    blocked_at = now()
  WHERE id = p_customer_id;
  
  -- Update website status
  UPDATE public.websites 
  SET 
    status = 'blocked',
    blocked_reason = p_reason,
    blocked_at = now()
  WHERE customer_id = p_customer_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function to unblock websites
CREATE OR REPLACE FUNCTION public.unblock_website(
  p_customer_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update customer record
  UPDATE public.customers 
  SET 
    is_blocked = false,
    blocked_reason = NULL,
    unblocked_at = now()
  WHERE id = p_customer_id;
  
  -- Update website status
  UPDATE public.websites 
  SET 
    status = 'active',
    blocked_reason = NULL,
    unblocked_at = now()
  WHERE customer_id = p_customer_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if customer should be blocked (payment overdue)
CREATE OR REPLACE FUNCTION public.check_payment_status()
RETURNS VOID AS $$
DECLARE
  customer_record RECORD;
BEGIN
  -- Find customers with expired subscriptions who are not already blocked
  FOR customer_record IN 
    SELECT id, name, subscription_end_date
    FROM public.customers 
    WHERE is_active = true 
      AND is_blocked = false 
      AND subscription_end_date < CURRENT_DATE
  LOOP
    -- Block the customer
    PERFORM public.block_website(customer_record.id, 'Subscription expired - payment overdue');
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to get blocked websites
CREATE OR REPLACE FUNCTION public.get_blocked_websites()
RETURNS TABLE (
  customer_id UUID,
  customer_name TEXT,
  website_url TEXT,
  domain TEXT,
  blocked_reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE,
  days_blocked INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.website_url,
    w.domain,
    c.blocked_reason,
    c.blocked_at,
    EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - c.blocked_at))::INTEGER as days_blocked
  FROM public.customers c
  LEFT JOIN public.websites w ON c.id = w.customer_id
  WHERE c.is_blocked = true
  ORDER BY c.blocked_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update website timestamps
CREATE TRIGGER update_websites_updated_at
  BEFORE UPDATE ON public.websites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for website management
CREATE OR REPLACE VIEW public.website_management AS
SELECT 
  c.id as customer_id,
  c.name as customer_name,
  c.phone,
  c.website_url,
  w.domain,
  w.status as website_status,
  c.subscription_type,
  c.subscription_end_date,
  c.is_active,
  c.is_blocked,
  c.blocked_reason,
  c.blocked_at,
  c.unblocked_at,
  CASE 
    WHEN c.subscription_end_date < CURRENT_DATE THEN 'expired'
    WHEN c.subscription_end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
    ELSE 'active'
  END as payment_status
FROM public.customers c
LEFT JOIN public.websites w ON c.id = w.customer_id
ORDER BY c.created_at DESC;

-- Grant permissions
GRANT ALL ON public.websites TO anon, authenticated;
GRANT ALL ON public.website_management TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.block_website(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_website(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_payment_status() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_blocked_websites() TO anon, authenticated;

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================
-- Insert sample websites for existing customers
INSERT INTO public.websites (customer_id, domain, status)
SELECT 
  id,
  COALESCE(website_url, 'https://' || LOWER(REPLACE(name, ' ', '')) || '.com'),
  'active'
FROM public.customers 
WHERE website_url IS NOT NULL OR website_url != '';

-- =====================================================
-- AUTOMATIC DEACTIVATION FUNCTIONS
-- =====================================================

-- Function to automatically deactivate expired subscriptions
CREATE OR REPLACE FUNCTION public.auto_deactivate_expired_subscriptions()
RETURNS VOID AS $$
BEGIN
  -- Deactivate customers whose subscriptions have expired
  UPDATE public.customers
  SET 
    is_active = FALSE,
    is_blocked = TRUE,
    blocked_reason = 'Subscription expired - automatic deactivation',
    blocked_at = now(),
    unblocked_at = NULL,
    updated_at = now()
  WHERE 
    is_active = TRUE 
    AND subscription_end_date < CURRENT_DATE
    AND subscription_end_date IS NOT NULL;

  -- Block websites of expired customers
  UPDATE public.websites
  SET 
    status = 'blocked',
    blocked_reason = 'Subscription expired - automatic deactivation',
    blocked_at = now(),
    unblocked_at = NULL,
    updated_at = now()
  WHERE 
    customer_id IN (
      SELECT id FROM public.customers 
      WHERE is_active = FALSE 
      AND blocked_reason = 'Subscription expired - automatic deactivation'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check and return expiring subscriptions (runs daily)
CREATE OR REPLACE FUNCTION public.check_expiring_subscriptions()
RETURNS TABLE(
  customer_id UUID,
  business_name TEXT,
  days_remaining INTEGER,
  subscription_end_date DATE,
  email TEXT,
  phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as customer_id,
    c.name as business_name,
    EXTRACT(DAY FROM (c.subscription_end_date - CURRENT_DATE))::INTEGER as days_remaining,
    c.subscription_end_date,
    c.phone as email, -- Using phone as email for now
    c.phone
  FROM public.customers c
  WHERE 
    c.is_active = TRUE 
    AND c.subscription_end_date IS NOT NULL
    AND c.subscription_end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
  ORDER BY c.subscription_end_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get all expired customers
CREATE OR REPLACE FUNCTION public.get_expired_customers()
RETURNS TABLE(
  customer_id UUID,
  business_name TEXT,
  subscription_end_date DATE,
  days_overdue INTEGER,
  email TEXT,
  phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as customer_id,
    c.name as business_name,
    c.subscription_end_date,
    EXTRACT(DAY FROM (CURRENT_DATE - c.subscription_end_date))::INTEGER as days_overdue,
    c.phone as email,
    c.phone
  FROM public.customers c
  WHERE 
    c.is_active = TRUE 
    AND c.subscription_end_date < CURRENT_DATE
    AND c.subscription_end_date IS NOT NULL
  ORDER BY c.subscription_end_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Add fields to revenue table for multiple month payments
ALTER TABLE public.revenue 
ADD COLUMN IF NOT EXISTS months_paid INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10,2) DEFAULT 0;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION public.auto_deactivate_expired_subscriptions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_expiring_subscriptions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_expired_customers() TO anon, authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration adds:
-- 1. Website URL and kill switch fields to customers table
-- 2. Websites table for managing client domains
-- 3. Functions for blocking/unblocking websites
-- 4. Payment status checking functionality
-- 5. Website management view
-- 6. Automatic deactivation functions for expired subscriptions
-- 6. Proper indexing and RLS policies
