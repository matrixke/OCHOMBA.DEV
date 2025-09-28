# 💰 Custom Pricing with USD Guide

## **Overview**
Your subscription tracker supports custom pricing for individual clients while using USD as the base currency. This allows you to offer personalized pricing while maintaining consistency across the system.

## **🎯 How Custom Pricing Works**

### **1. Standard vs Custom Pricing**

#### **Standard Pricing (Plan-Based)**
- **Basic Plan**: $20/month
- **Premium Plan**: $35/month
- **Enterprise Plan**: $50/month
- **Starter Plan**: $8/month
- **Standard Plan**: $10/month
- **Professional Plan**: $15/month

#### **Custom Pricing (Client-Specific)**
- **Any Amount**: Set any USD amount per month
- **Override Plans**: Custom price overrides plan price
- **Flexible Rates**: Different rates for different clients
- **Special Deals**: Negotiated pricing for specific clients

### **2. Setting Custom Pricing**

#### **When Adding a New Customer:**
1. **Go to Dashboard** → **Add Customer**
2. **Fill in Basic Info** (name, email, phone, etc.)
3. **Select Subscription Plan** (this sets the default price)
4. **Toggle "Use Custom Price"** switch
5. **Enter Custom Amount** in USD
6. **Save Customer**

#### **When Editing Existing Customer:**
1. **Go to Dashboard** → **Click Edit** on customer card
2. **Toggle "Use Custom Price"** switch
3. **Enter New Custom Amount** in USD
4. **Save Changes**

### **3. Custom Pricing Examples**

#### **Example 1: Discounted Client**
- **Plan**: Enterprise ($50/month)
- **Custom Price**: $35/month
- **Reason**: Long-term client, negotiated discount
- **Savings**: $15/month ($180/year)

#### **Example 2: Premium Client**
- **Plan**: Basic ($20/month)
- **Custom Price**: $45/month
- **Reason**: Additional services included
- **Upsell**: $25/month additional revenue

#### **Example 3: Special Package**
- **Plan**: Premium ($35/month)
- **Custom Price**: $25/month
- **Reason**: Annual prepayment discount
- **Savings**: $10/month ($120/year)

## **💡 Custom Pricing Features**

### **1. Visual Indicators**
- **Custom Price Badge**: Shows "Custom Price" on customer cards
- **Price Display**: Shows custom amount instead of plan price
- **Clear Labeling**: "Custom Monthly Price (USD)" in forms

### **2. Payment Integration**
- **Paystack Links**: Generated with custom amounts
- **WhatsApp Messages**: Include custom pricing
- **Email Reminders**: Show custom amounts
- **Multiple Month Payments**: Calculate based on custom price

### **3. Analytics Integration**
- **Revenue Tracking**: Custom prices included in revenue calculations
- **Custom Pricing Rate**: Percentage of clients using custom pricing
- **Revenue Analysis**: Separate tracking for custom vs standard pricing

## **🔧 Technical Implementation**

### **Database Fields**
```sql
-- Custom pricing fields in customers table
custom_price DECIMAL(10,2),        -- Custom monthly amount
use_custom_price BOOLEAN DEFAULT FALSE  -- Whether to use custom price
```

### **Price Calculation Logic**
```javascript
// How the system determines which price to use
const getSubscriptionPrice = (customer) => {
  if (customer.useCustomPrice && customer.customPrice > 0) {
    return customer.customPrice;  // Use custom price
  }
  return plan.price;  // Use standard plan price
};
```

### **Components That Handle Custom Pricing**
- ✅ **CustomerForm**: Input and validation
- ✅ **CustomerCard**: Display and calculations
- ✅ **PaystackIntegration**: Payment processing
- ✅ **Dashboard**: Customer management
- ✅ **Analytics**: Revenue calculations

## **📊 Custom Pricing Analytics**

### **Available Metrics**
- **Custom Pricing Rate**: % of clients using custom pricing
- **Average Custom Price**: Mean custom price across clients
- **Custom vs Standard Revenue**: Revenue breakdown
- **Pricing Distribution**: Range of custom prices

### **Analytics Cards**
- **Custom Pricing Rate**: Shows percentage of clients with custom pricing
- **Revenue Breakdown**: Separates custom and standard pricing revenue
- **Pricing Trends**: Tracks custom pricing adoption over time

## **🎯 Business Benefits**

### **1. Flexibility**
- **Negotiated Rates**: Accommodate different client budgets
- **Special Deals**: Offer discounts for long-term clients
- **Upselling**: Charge premium rates for additional services
- **Market Adaptation**: Adjust pricing based on market conditions

### **2. Client Retention**
- **Personalized Pricing**: Clients feel valued with custom rates
- **Flexible Terms**: Accommodate different payment capabilities
- **Special Relationships**: Build stronger client relationships
- **Competitive Advantage**: Match or beat competitor pricing

### **3. Revenue Optimization**
- **Higher Revenue**: Charge premium rates where possible
- **Client Acquisition**: Offer competitive rates to win clients
- **Upselling Opportunities**: Increase revenue from existing clients
- **Market Penetration**: Use pricing to enter new markets

## **💼 Use Cases**

### **1. Startup Clients**
- **Standard Plan**: Basic ($20/month)
- **Custom Price**: $15/month
- **Reason**: Help startups get started
- **Benefit**: Build long-term relationships

### **2. Enterprise Clients**
- **Standard Plan**: Enterprise ($50/month)
- **Custom Price**: $75/month
- **Reason**: Additional support and features
- **Benefit**: Higher revenue per client

### **3. Long-term Clients**
- **Standard Plan**: Premium ($35/month)
- **Custom Price**: $25/month
- **Reason**: Loyalty discount
- **Benefit**: Retain valuable clients

### **4. Seasonal Clients**
- **Standard Plan**: Basic ($20/month)
- **Custom Price**: $30/month (peak season), $15/month (off-season)
- **Reason**: Seasonal business adjustments
- **Benefit**: Flexible pricing model

## **🔍 Monitoring Custom Pricing**

### **Dashboard Indicators**
- **Customer Cards**: Show "Custom Price" badge
- **Price Display**: Custom amount instead of plan price
- **Status Indicators**: Clear visual distinction

### **Analytics Tracking**
- **Custom Pricing Rate**: Monitor adoption
- **Revenue Impact**: Track custom pricing contribution
- **Client Distribution**: See who uses custom pricing
- **Pricing Trends**: Track custom pricing over time

### **Reports Available**
- **Custom Pricing Report**: List all clients with custom pricing
- **Revenue Analysis**: Custom vs standard pricing breakdown
- **Pricing Distribution**: Range and frequency of custom prices
- **Client Segmentation**: Group clients by pricing type

## **⚠️ Important Notes**

### **1. Price Validation**
- **Minimum Price**: No minimum enforced (can be $0.01)
- **Maximum Price**: No maximum enforced (can be $999.99)
- **Decimal Places**: Supports up to 2 decimal places
- **Currency**: All prices in USD

### **2. Payment Processing**
- **Paystack Integration**: Handles custom amounts correctly
- **Multiple Month Payments**: Calculates based on custom price
- **Discounts**: Annual discount applies to custom prices too
- **Webhook Processing**: Correctly processes custom payments

### **3. Data Consistency**
- **Database Storage**: Custom prices stored as DECIMAL(10,2)
- **Type Safety**: TypeScript interfaces ensure data integrity
- **Validation**: Client-side and server-side validation
- **Backup**: Custom prices included in data backups

## **🚀 Best Practices**

### **1. Setting Custom Prices**
- **Document Reasons**: Note why custom pricing was used
- **Regular Reviews**: Periodically review custom pricing
- **Market Research**: Ensure custom prices are competitive
- **Client Communication**: Clearly explain custom pricing

### **2. Managing Custom Pricing**
- **Track Performance**: Monitor custom pricing impact
- **Client Feedback**: Get feedback on custom pricing
- **Regular Updates**: Adjust custom prices as needed
- **Documentation**: Keep records of custom pricing decisions

### **3. Analytics Usage**
- **Monitor Trends**: Track custom pricing adoption
- **Revenue Analysis**: Understand custom pricing impact
- **Client Segmentation**: Group clients by pricing type
- **Performance Metrics**: Measure custom pricing success

---

## **✅ Summary**

Your custom pricing system is fully functional with USD currency:

- ✅ **Flexible Pricing**: Set any USD amount for individual clients
- ✅ **Visual Indicators**: Clear display of custom vs standard pricing
- ✅ **Payment Integration**: Paystack handles custom amounts correctly
- ✅ **Analytics Tracking**: Monitor custom pricing usage and impact
- ✅ **Multiple Month Payments**: Custom pricing works with all payment options
- ✅ **Discounts**: Annual discounts apply to custom prices
- ✅ **Data Integrity**: Proper validation and storage

**Custom pricing gives you the flexibility to serve different client needs while maintaining a professional, USD-based pricing system!** 🎉
