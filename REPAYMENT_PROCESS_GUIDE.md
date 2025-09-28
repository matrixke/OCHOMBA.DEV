# 🔄 Repayment Process Guide

## **Overview**
This guide explains how the repayment process works, including date tracking, multiple month payments, and automatic subscription management.

## **🔄 How the Repayment Process Works**

### **1. Payment Initiation**
- **Location**: Dashboard → Customer Card → "Send Payment" button
- **Process**: Opens PaystackIntegration dialog with payment options
- **Features**: 
  - Multiple month selection (1, 2, 3, 6, 12 months)
  - Automatic discount calculation
  - Custom pricing support

### **2. Multiple Month Payment Options**

#### **Available Options:**
- **1 Month**: Standard rate (no discount)
- **2 Months**: Standard rate (no discount)
- **3 Months**: Standard rate (no discount)
- **6 Months**: Standard rate (no discount)
- **12 Months**: 10% discount

#### **Discount Calculation:**
```javascript
// Example for 12 months at KES 2,000/month
Monthly Rate: KES 2,000
Duration: 12 months
Subtotal: KES 24,000
Discount (10%): KES 2,400
Final Amount: KES 21,600

// Example for 3 months at KES 2,000/month
Monthly Rate: KES 2,000
Duration: 3 months
Subtotal: KES 6,000
Discount: KES 0
Final Amount: KES 6,000
```

### **3. Payment Link Generation**

#### **Paystack Link Structure:**
```
https://paystack.com/pay/{reference}?
  amount={amountInKobo}&
  email={customerEmail}&
  metadata[customer_id]={customerId}&
  metadata[business_name]={businessName}&
  metadata[months_paid]={monthsToPay}
```

#### **Key Features:**
- **Unique Reference**: `OCHOMBA_{customerId}_{timestamp}`
- **Amount in Kobo**: Paystack requires amount in smallest currency unit
- **Metadata**: Includes customer info and months paid for webhook processing

### **4. Webhook Processing**

#### **When Payment is Successful:**
1. **Signature Verification**: Validates Paystack webhook signature
2. **Customer Lookup**: Retrieves customer data from database
3. **Date Calculation**: 
   - If existing subscription end date is in future → extends from there
   - If expired or no end date → starts from current date
   - Adds paid months to the end date
4. **Database Updates**:
   - Updates `subscription_end_date` with new end date
   - Sets `is_active = true`
   - Sets `is_blocked = false`
   - Clears blocking reasons and timestamps
5. **Website Unblocking**: Calls `unblock_customer_websites` function
6. **Revenue Recording**: Adds payment record with months paid info

#### **Example Date Calculation:**
```javascript
// Customer paid for 3 months on Jan 15, 2025
Current Date: Jan 15, 2025
Existing End Date: Jan 20, 2025 (5 days remaining)
New End Date: Apr 20, 2025 (extends from existing date)

// If customer was expired
Current Date: Jan 15, 2025
Existing End Date: Dec 20, 2024 (expired)
New End Date: Apr 15, 2025 (starts from current date)
```

### **5. Automatic Deactivation**

#### **Daily Cron Job:**
- **Schedule**: Runs daily at 9 AM UTC
- **Function**: `auto_deactivate_expired_subscriptions()`
- **Process**:
  1. Finds customers with `subscription_end_date < current_date`
  2. Sets `is_active = false`
  3. Sets `is_blocked = true`
  4. Updates blocking reason to "Subscription expired - automatic deactivation"
  5. Blocks associated websites

#### **Manual Trigger:**
- **Location**: Dashboard → "Auto Deactivation" tab
- **Features**: 
  - View expiring subscriptions (next 7 days)
  - View expired subscriptions
  - Manual deactivation trigger
  - Real-time status updates

## **📊 Data Tracking**

### **Revenue Table Fields:**
- `amount`: Total amount paid
- `months_paid`: Number of months purchased
- `payment_reference`: Paystack reference number
- `discount_applied`: Discount amount given
- `client_id`: Customer ID
- `type`: 'subscription' or 'one-time'
- `date`: Payment date

### **Customer Table Fields:**
- `subscription_end_date`: When subscription expires
- `is_active`: Current subscription status
- `is_blocked`: Website blocking status
- `custom_price`: Custom monthly rate
- `use_custom_price`: Whether using custom pricing

## **🔧 Configuration**

### **Environment Variables:**
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret
CRON_SECRET_TOKEN=your_cron_secret
```

### **Paystack Setup:**
1. **Webhook URL**: `https://your-domain.com/api/paystack-webhook`
2. **Events**: `charge.success`
3. **Secret**: Use same secret in environment variables

## **📱 User Experience**

### **For Business Owner:**
1. **Select Customer**: Click "Send Payment" on customer card
2. **Choose Duration**: Select 1-12 months with discount preview
3. **Generate Link**: Creates Paystack payment link
4. **Send Reminder**: WhatsApp or email with payment details
5. **Monitor Status**: View payment status and subscription dates

### **For Customer:**
1. **Receive Link**: Gets WhatsApp/email with payment link
2. **Make Payment**: Pays through Paystack (secure)
3. **Automatic Activation**: Website unblocks immediately
4. **Confirmation**: Receives payment confirmation

## **🛡️ Security Features**

### **Webhook Security:**
- **Signature Verification**: Validates Paystack webhook authenticity
- **CORS Headers**: Proper cross-origin request handling
- **Error Handling**: Comprehensive error logging and responses

### **Data Protection:**
- **Service Role Key**: Uses elevated permissions for database writes
- **Input Validation**: Validates all incoming data
- **Audit Trail**: Complete payment and subscription history

## **🚀 Benefits**

### **For Business:**
- **Automated Billing**: No manual subscription management
- **Multiple Payment Options**: Flexible payment terms
- **Annual Discount**: 10% discount encourages yearly commitments
- **Real-time Tracking**: Always know subscription status

### **For Customers:**
- **Flexible Payments**: Pay for multiple months upfront
- **Annual Savings**: 10% discount on yearly payments
- **Instant Activation**: Immediate website unblocking
- **Transparent Pricing**: Clear pricing with annual discount

## **📈 Analytics Integration**

### **Revenue Tracking:**
- **Monthly Revenue**: Includes all subscription payments
- **Custom Pricing**: Tracks customers with custom rates
- **Discount Analysis**: Monitors discount usage and savings
- **Payment Trends**: Historical payment data and patterns

### **Subscription Metrics:**
- **Active Subscriptions**: Current active customer count
- **Expiration Tracking**: Upcoming subscription renewals
- **Churn Analysis**: Customer retention and loss rates
- **Revenue Forecasting**: Projected income based on current subscriptions

---

## **🔧 Troubleshooting**

### **Common Issues:**
1. **Webhook Not Firing**: Check Paystack webhook configuration
2. **Date Calculation Errors**: Verify timezone settings
3. **Website Not Unblocking**: Check `unblock_customer_websites` function
4. **Payment Not Recorded**: Verify webhook secret and database permissions

### **Debug Steps:**
1. Check webhook logs in Paystack dashboard
2. Verify environment variables
3. Test webhook with Paystack test events
4. Check database for payment records
5. Verify customer subscription dates

---

**The repayment process is now fully automated and supports flexible payment options while maintaining accurate date tracking and subscription management!** 🎉
