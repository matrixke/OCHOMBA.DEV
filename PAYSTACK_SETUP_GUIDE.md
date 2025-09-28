# Paystack Integration Setup Guide

This guide will help you set up Paystack payment integration with automatic website unblocking.

## Features Added

✅ **Custom Pricing** - Set custom monthly prices for individual customers
✅ **Paystack Integration** - Generate payment links with one click
✅ **WhatsApp Messaging** - Send payment reminders via WhatsApp
✅ **Email Integration** - Send payment emails with Paystack links
✅ **Automatic Unblocking** - Websites unblock automatically after payment
✅ **Automatic Deactivation** - Expired subscriptions deactivate automatically
✅ **Daily Monitoring** - System checks for expiring subscriptions daily
✅ **Website Blocking** - Customer websites block when subscriptions expire

## Step-by-Step Setup

### 1. Database Migration

First, run the updated migration to add custom pricing and automatic deactivation:

```sql
-- Run this in your Supabase SQL Editor
-- This adds custom pricing fields and automatic deactivation functions
-- The migration file: supabase/migrations/20250115000001-add-website-management.sql
-- includes all necessary functions for automatic deactivation
```

### 2. Paystack Account Setup

1. **Create Paystack Account**
   - Go to [https://dashboard.paystack.com](https://dashboard.paystack.com)
   - Sign up for a new account
   - Complete business verification

2. **Get API Keys**
   - Go to Settings > API Keys & Webhooks
   - Copy your **Public Key** (starts with `pk_test_` or `pk_live_`)
   - Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

3. **Set Up Webhooks**
   - Go to Settings > API Keys & Webhooks
   - Click "Add Webhook"
   - Webhook URL: `https://your-domain.com/api/paystack-webhook`
   - Events to send: `charge.success`
   - Save the webhook

### 3. Configure Paystack in Dashboard

1. **Open Your Dashboard**
   - Go to the Clients tab
   - Click "Send Payment" on any customer card

2. **Enter Paystack Details**
   - **Public Key**: Your Paystack public key
   - **Secret Key**: Your Paystack secret key  
   - **Business Email**: Your business email for notifications

3. **Test the Integration**
   - Click "Generate Paystack Link & Messages"
   - Test the generated payment link
   - Verify WhatsApp and email messages

### 4. Custom Pricing Setup

1. **Add Customer with Custom Price**
   - Click "Add New Client"
   - Fill in customer details
   - In "Pricing Options" section:
     - Toggle "Use Custom Price" ON
     - Enter custom amount (e.g., 5000)
   - Save the customer

2. **Edit Existing Customer**
   - Click "Edit" on any customer card
   - Toggle "Use Custom Price" ON
   - Enter custom amount
   - Save changes

### 5. Payment Flow

1. **Send Payment Request**
   - Click "Send Payment" on customer card
   - Configure Paystack settings (if not done)
   - Click "Generate Paystack Link & Messages"
   - Use "Send WhatsApp" or "Send Email" buttons

2. **Customer Payment**
   - Customer receives WhatsApp/Email with payment link
   - Customer clicks link and pays via Paystack
   - Payment is processed securely by Paystack

3. **Automatic Unblocking**
   - Paystack sends webhook to your server
   - Website automatically unblocks
   - Customer receives confirmation

### 6. Server-Side Webhook Implementation

Create a server-side webhook handler (example for Vercel):

```javascript
// api/paystack-webhook.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook signature (recommended)
  const signature = req.headers['x-paystack-signature'];
  // Add signature verification logic here

  const webhookData = req.body;

  if (webhookData.event === 'charge.success') {
    const paymentData = webhookData.data;
    const customerId = paymentData.metadata?.customer_id;
    const amount = paymentData.amount / 100; // Convert from kobo

    if (customerId) {
      try {
        // Unblock customer
        await supabase
          .from('customers')
          .update({
            is_blocked: false,
            blocked_reason: null,
            unblocked_at: new Date().toISOString(),
          })
          .eq('id', customerId);

        // Unblock website
        await supabase
          .from('websites')
          .update({
            status: 'active',
            blocked_reason: null,
            unblocked_at: new Date().toISOString(),
          })
          .eq('customer_id', customerId);

        // Add revenue record
        await supabase
          .from('revenue')
          .insert({
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            description: `Payment received from ${paymentData.metadata?.business_name}`,
          });

        console.log(`Payment successful: ${customerId} - KES ${amount}`);
      } catch (error) {
        console.error('Error processing payment:', error);
      }
    }
  }

  res.status(200).json({ received: true });
}
```

### 7. Environment Variables

Add these to your `.env.local` file:

```env
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Paystack
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
```

### 8. Set Up Automatic Deactivation

1. **Configure Daily Cron Job**:
   - Set up a daily cron job to call `/api/cron-deactivation`
   - This automatically deactivates expired subscriptions
   - See `AUTOMATIC_DEACTIVATION_SETUP.md` for detailed instructions

2. **Test Automatic Deactivation**:
   - Go to "Auto Deactivation" tab in dashboard
   - Click "Run Deactivation" to test manually
   - Verify expired customers are deactivated and websites blocked

### 9. Testing the Complete Flow

1. **Add a Test Customer**
   - Use test email: `test@example.com`
   - Set custom price: `1000`
   - Save customer

2. **Block the Customer**
   - Go to Websites tab
   - Click "Block" on the customer's website
   - Verify website is blocked

3. **Send Payment Request**
   - Go to Clients tab
   - Click "Send Payment" on test customer
   - Generate payment link
   - Send via WhatsApp/Email

4. **Test Payment**
   - Use Paystack test card: `4084084084084081`
   - Expiry: Any future date
   - CVV: Any 3 digits
   - Complete payment

5. **Verify Unblocking**
   - Check if website is automatically unblocked
   - Verify revenue record is added
   - Check customer status in dashboard

### 9. Production Deployment

1. **Update API Keys**
   - Replace test keys with live keys
   - Update webhook URL to production domain
   - Test with real payments

2. **Security Considerations**
   - Verify webhook signatures
   - Use HTTPS for all endpoints
   - Implement rate limiting
   - Monitor webhook logs

3. **Monitoring**
   - Set up alerts for failed payments
   - Monitor webhook delivery
   - Track payment success rates

## Troubleshooting

### Common Issues

1. **Webhook Not Working**
   - Check webhook URL is accessible
   - Verify webhook secret
   - Check server logs

2. **Payment Links Not Generating**
   - Verify API keys are correct
   - Check customer data is complete
   - Ensure amount is valid

3. **Websites Not Unblocking**
   - Check webhook is receiving events
   - Verify database permissions
   - Check customer ID in metadata

### Debug Mode

Enable debug logging by adding this to your webhook:

```javascript
console.log('Webhook received:', JSON.stringify(webhookData, null, 2));
```

## Support

For issues with:
- **Paystack**: Contact Paystack support
- **Dashboard**: Check console logs and database
- **Webhooks**: Verify server configuration

## Next Steps

1. Set up monitoring and alerts
2. Implement payment retry logic
3. Add payment analytics
4. Create customer payment history
5. Implement subscription renewals

This integration provides a complete payment solution with automatic website management!
