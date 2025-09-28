# Automatic Deactivation Setup Guide

This guide will help you set up automatic deactivation of expired subscriptions with website blocking.

## Features Added

✅ **Automatic Deactivation** - Expired subscriptions are deactivated automatically
✅ **Website Blocking** - Customer websites are blocked when subscriptions expire
✅ **Daily Monitoring** - System checks for expiring subscriptions daily
✅ **Manual Control** - Run deactivation manually when needed
✅ **Expiration Alerts** - Visual alerts for expiring and expired subscriptions
✅ **Cron Job Integration** - Automated daily processing

## How It Works

### 1. **Daily Automatic Process**
- System runs daily checks for expired subscriptions
- Automatically deactivates customers whose subscription end date has passed
- Blocks their websites with "Subscription expired" message
- Updates customer status and website status

### 2. **Manual Control**
- Dashboard shows expiring subscriptions (next 7 days)
- Dashboard shows expired subscriptions (overdue)
- Manual "Run Deactivation" button for immediate processing
- Real-time status monitoring

### 3. **Smart Blocking**
- Websites are blocked with clear expiration message
- Customers can see why their website is blocked
- Easy reactivation after payment

## Setup Instructions

### Step 1: Database Migration

Run the updated migration to add automatic deactivation functions:

```sql
-- Run this in your Supabase SQL Editor
-- The migration file already includes these functions:
-- - auto_deactivate_expired_subscriptions()
-- - check_expiring_subscriptions()
-- - get_expired_customers()
```

### Step 2: Deploy Cron Job API

1. **Create the API endpoint** (already created as `public/api/cron-deactivation.js`)

2. **Set Environment Variables** in your deployment platform:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   CRON_SECRET_TOKEN=your-secure-token-here
   ```

3. **Deploy to Vercel/Netlify**:
   - The API endpoint will be available at: `https://your-domain.com/api/cron-deactivation`

### Step 3: Set Up Daily Cron Job

#### Option A: Using Vercel Cron Jobs

1. **Create `vercel.json`** in your project root:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron-deactivation",
         "schedule": "0 9 * * *"
       }
     ]
   }
   ```

2. **Deploy to Vercel** - Cron job will run daily at 9 AM UTC

#### Option B: Using External Cron Service

1. **Use a service like cron-job.org or EasyCron**
2. **Set up daily job**:
   - URL: `https://your-domain.com/api/cron-deactivation`
   - Method: POST
   - Headers: `Authorization: Bearer your-secure-token`
   - Schedule: Daily at your preferred time

#### Option C: Using GitHub Actions

1. **Create `.github/workflows/daily-deactivation.yml`**:
   ```yaml
   name: Daily Deactivation
   on:
     schedule:
       - cron: '0 9 * * *'  # Daily at 9 AM UTC
   jobs:
     deactivate:
       runs-on: ubuntu-latest
       steps:
         - name: Run Deactivation
           run: |
             curl -X POST https://your-domain.com/api/cron-deactivation \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}"
   ```

### Step 4: Test the System

1. **Manual Testing**:
   - Go to "Auto Deactivation" tab in dashboard
   - Click "Run Deactivation" to test manually
   - Check if expired customers are deactivated

2. **Create Test Data**:
   - Add a customer with past subscription end date
   - Run manual deactivation
   - Verify customer is deactivated and website is blocked

3. **Test Cron Job**:
   - Call the API endpoint manually: `POST /api/cron-deactivation`
   - Check logs for successful execution
   - Verify expired customers are processed

## Dashboard Features

### 1. **Auto Deactivation Tab**
- **Control Panel**: Manual deactivation trigger
- **Expiring Subscriptions**: Customers expiring in next 7 days
- **Expired Subscriptions**: Overdue customers requiring attention
- **Status Monitoring**: Real-time subscription status

### 2. **Visual Indicators**
- **Color-coded badges**: Green (active), Yellow (warning), Orange (critical), Red (expired)
- **Days remaining/overdue**: Clear countdown for each customer
- **Status alerts**: Prominent warnings for expired subscriptions

### 3. **Manual Controls**
- **Run Deactivation**: Immediate processing of expired subscriptions
- **Refresh Status**: Update the display with latest data
- **Real-time Monitoring**: See changes as they happen

## Configuration Options

### 1. **Deactivation Timing**
- **Default**: Deactivates on subscription end date
- **Grace Period**: Can be modified in database functions
- **Custom Rules**: Add business logic as needed

### 2. **Notification Settings**
- **Email Alerts**: Send notifications before expiration
- **WhatsApp Reminders**: Automated payment reminders
- **Dashboard Alerts**: Visual indicators for urgent cases

### 3. **Blocking Messages**
- **Custom Messages**: Modify the "Subscription expired" message
- **Contact Information**: Include support details
- **Payment Links**: Direct customers to payment page

## Monitoring and Maintenance

### 1. **Daily Monitoring**
- Check "Auto Deactivation" tab daily
- Review expiring subscriptions
- Send payment reminders before expiration

### 2. **Weekly Review**
- Check expired subscriptions list
- Follow up on overdue accounts
- Update customer information as needed

### 3. **Monthly Analysis**
- Review deactivation patterns
- Identify common expiration issues
- Optimize payment reminder timing

## Troubleshooting

### Common Issues

1. **Cron Job Not Running**
   - Check API endpoint is accessible
   - Verify environment variables
   - Check cron service logs

2. **Customers Not Deactivating**
   - Verify subscription end dates are set
   - Check database permissions
   - Review function execution logs

3. **Websites Not Blocking**
   - Verify website management setup
   - Check kill switch configuration
   - Test manual blocking first

### Debug Mode

Enable detailed logging by adding this to your API:

```javascript
console.log('Processing customer:', customer.id, 'End date:', customer.subscription_end_date);
```

## Security Considerations

1. **API Protection**
   - Use secure tokens for cron job authentication
   - Implement rate limiting
   - Monitor for unusual activity

2. **Database Security**
   - Use service role key for cron operations
   - Implement proper RLS policies
   - Regular security audits

3. **Customer Data**
   - Encrypt sensitive information
   - Follow data protection regulations
   - Secure payment processing

## Advanced Features

### 1. **Custom Deactivation Rules**
- Different rules for different subscription types
- Grace periods for premium customers
- Escalation procedures for overdue accounts

### 2. **Integration with Payment Systems**
- Automatic reactivation after payment
- Payment status synchronization
- Revenue tracking and reporting

### 3. **Customer Communication**
- Automated email sequences
- SMS notifications
- In-app messaging

## Support and Maintenance

### Regular Tasks
- Monitor cron job execution
- Review deactivation logs
- Update customer information
- Test system functionality

### Emergency Procedures
- Manual deactivation if cron fails
- Customer support for blocked websites
- Payment processing issues
- System recovery procedures

This automatic deactivation system ensures that expired subscriptions are handled consistently and efficiently, reducing manual work and improving cash flow management.
