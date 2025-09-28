# 🗄️ Database Restoration Guide for Subscription Tracker Dashboard

## 📋 Prerequisites
- Supabase project restored and accessible
- Supabase CLI installed (optional, for local development)
- Access to your Supabase project dashboard

## 🚀 Quick Database Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open your Supabase project dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `zyldmilbkpditmpfcvut`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the complete migration**
   - Copy the entire content from: `supabase/migrations/20250715000000-complete-database-setup.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

4. **Verify the setup**
   - Go to "Table Editor" in the left sidebar
   - You should see: `customers`, `revenue`, `subscription_plans`
   - Check "Database" → "Functions" for the custom functions
   - Check "Database" → "Views" for the reporting views

### Option 2: Using Supabase CLI

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link your project**
   ```bash
   supabase link --project-ref zyldmilbkpditmpfcvut
   ```

4. **Run the migration**
   ```bash
   supabase db push
   ```

## 🔍 What Gets Created

### 📊 Tables
- **`customers`** - Client information and subscriptions
- **`revenue`** - Payment and revenue tracking
- **`subscription_plans`** - Available subscription tiers

### ⚡ Functions
- **`update_updated_at_column()`** - Auto-updates timestamps
- **`calculate_subscription_end_date()`** - Calculates expiry dates
- **`is_subscription_expired()`** - Checks if subscription expired
- **`days_until_expiry()`** - Days remaining until expiry

### 🔄 Triggers
- **Automatic timestamp updates** on customer changes
- **Subscription end date calculation** on insert/update

### 📈 Views
- **`active_customers`** - View of all active subscriptions
- **`revenue_summary`** - Monthly revenue analytics

### 🛡️ Security
- **Row Level Security (RLS)** enabled
- **Access policies** configured for your app

## 🧪 Sample Data
The migration includes sample data for testing:
- Sample customer: "Sample Business Ltd"
- Sample revenue entry: KES 2,000

## ✅ Verification Steps

After running the migration, verify:

1. **Tables exist and are accessible**
2. **Sample data is visible**
3. **Your app can connect and read/write data**
4. **Custom pricing works correctly**

## 🆘 Troubleshooting

### Common Issues:

1. **"Permission denied" errors**
   - Check RLS policies are correctly applied
   - Verify your Supabase API keys are correct

2. **Tables not visible**
   - Refresh the Supabase dashboard
   - Check if the migration completed successfully

3. **App connection issues**
   - Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Check browser console for error messages

## 📞 Support

If you encounter issues:
1. Check the Supabase dashboard logs
2. Verify your project is fully restored
3. Ensure you have the correct project credentials

## 🎯 Next Steps

After successful database restoration:
1. **Test adding a customer** with custom pricing
2. **Verify revenue tracking** works
3. **Check analytics** display correctly
4. **Test WhatsApp reminders** functionality

---

**Migration File**: `supabase/migrations/20250715000000-complete-database-setup.sql`
**Project ID**: `zyldmilbkpditmpfcvut`
**Status**: Ready for execution
