-- =====================================================
-- SIMPLE DATABASE SETUP FOR USD PRICING
-- No conversion - you will set prices manually
-- =====================================================

-- 1. Ensure custom pricing fields exist in customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS custom_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS use_custom_price BOOLEAN NOT NULL DEFAULT false;

-- 2. Ensure revenue table has custom pricing fields
ALTER TABLE public.revenue 
ADD COLUMN IF NOT EXISTS months_paid INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.customers(id);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_custom_price ON public.customers(custom_price);
CREATE INDEX IF NOT EXISTS idx_customers_use_custom_price ON public.customers(use_custom_price);
CREATE INDEX IF NOT EXISTS idx_revenue_months_paid ON public.revenue(months_paid);
CREATE INDEX IF NOT EXISTS idx_revenue_client_id ON public.revenue(client_id);

-- 4. Add constraints to ensure data integrity
ALTER TABLE public.customers 
ADD CONSTRAINT check_custom_price_positive 
CHECK (custom_price IS NULL OR custom_price >= 0);

ALTER TABLE public.revenue 
ADD CONSTRAINT check_months_paid_positive 
CHECK (months_paid > 0);

-- 5. Show current data structure
SELECT 
  'customers' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN use_custom_price = true THEN 1 END) as custom_pricing_count,
  ROUND(AVG(price), 2) as avg_price,
  ROUND(MIN(price), 2) as min_price,
  ROUND(MAX(price), 2) as max_price
FROM public.customers

UNION ALL

SELECT 
  'revenue' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN months_paid > 1 THEN 1 END) as multi_month_payments,
  ROUND(AVG(amount), 2) as avg_amount,
  ROUND(MIN(amount), 2) as min_amount,
  ROUND(MAX(amount), 2) as max_amount
FROM public.revenue;

-- 6. Show sample data
SELECT 
  id,
  name,
  subscription_type,
  ROUND(price, 2) as price_usd,
  ROUND(custom_price, 2) as custom_price_usd,
  use_custom_price,
  CASE 
    WHEN use_custom_price = true THEN ROUND(custom_price, 2)
    ELSE ROUND(price, 2)
  END as final_price_usd
FROM public.customers
LIMIT 10;
