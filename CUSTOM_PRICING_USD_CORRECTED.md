# 💰 Custom Pricing with Corrected USD Exchange Rate

## **Exchange Rate: 1 USD = 127.5 KES**

This guide explains how custom pricing works with the corrected USD conversion using the proper exchange rate.

## **🎯 Custom Pricing System Overview**

### **How Custom Pricing Works:**
1. **Client selects a subscription plan** (Basic, Premium, etc.)
2. **Toggle "Use Custom Price"** switch
3. **Enter custom USD amount** (any amount you want)
4. **System uses custom price** instead of plan price
5. **All calculations** (payments, analytics) use custom price

### **Custom Pricing Logic:**
```javascript
// System automatically chooses between custom or plan price
if (customer.useCustomPrice && customer.customPrice > 0) {
  return customer.customPrice;  // Use custom USD amount
}
return plan.price;  // Use standard plan price (also in USD)
```

## **💱 Corrected USD Pricing Structure**

### **Standard Plans (USD):**
- **Starter**: $6.27/month (was 800 KES)
- **Standard**: $7.84/month (was 1000 KES)
- **Professional**: $11.76/month (was 1500 KES)
- **Basic**: $15.69/month (was 2000 KES)
- **Premium**: $27.45/month (was 3500 KES)
- **Enterprise**: $39.22/month (was 5000 KES)

### **Custom Pricing Examples:**

#### **Example 1: Discounted Client**
- **Plan**: Enterprise ($39.22/month)
- **Custom Price**: $25.00/month
- **Reason**: Long-term client, negotiated discount
- **Savings**: $14.22/month ($170.64/year)

#### **Example 2: Premium Client**
- **Plan**: Basic ($15.69/month)
- **Custom Price**: $35.00/month
- **Reason**: Additional services included
- **Upsell**: $19.31/month additional revenue

#### **Example 3: Special Package**
- **Plan**: Premium ($27.45/month)
- **Custom Price**: $20.00/month
- **Reason**: Annual prepayment discount
- **Savings**: $7.45/month ($89.40/year)

## **🔧 Custom Pricing Conversion Examples**

### **If You Have Existing KES Custom Prices:**

| KES Custom Price | USD Custom Price | Calculation |
|------------------|------------------|-------------|
| 1500 KES | $11.76 | 1500 ÷ 127.5 |
| 2000 KES | $15.69 | 2000 ÷ 127.5 |
| 2500 KES | $19.61 | 2500 ÷ 127.5 |
| 3000 KES | $23.53 | 3000 ÷ 127.5 |
| 4000 KES | $31.37 | 4000 ÷ 127.5 |
| 5000 KES | $39.22 | 5000 ÷ 127.5 |
| 6000 KES | $47.06 | 6000 ÷ 127.5 |

### **Common Custom Pricing Scenarios:**

#### **Startup Clients:**
- **Standard Plan**: Basic ($15.69/month)
- **Custom Price**: $10.00/month
- **Reason**: Help startups get started
- **Benefit**: Build long-term relationships

#### **Enterprise Clients:**
- **Standard Plan**: Enterprise ($39.22/month)
- **Custom Price**: $50.00/month
- **Reason**: Additional support and features
- **Benefit**: Higher revenue per client

#### **Long-term Clients:**
- **Standard Plan**: Premium ($27.45/month)
- **Custom Price**: $20.00/month
- **Reason**: Loyalty discount
- **Benefit**: Retain valuable clients

## **📊 Custom Pricing Analytics**

### **Available Metrics:**
- **Custom Pricing Rate**: % of clients using custom pricing
- **Average Custom Price**: Mean custom price across clients
- **Custom vs Standard Revenue**: Revenue breakdown
- **Pricing Distribution**: Range of custom prices

### **Analytics Cards:**
- **Custom Pricing Rate**: Shows percentage of clients with custom pricing
- **Revenue Breakdown**: Separates custom and standard pricing revenue
- **Pricing Trends**: Tracks custom pricing adoption over time

## **💡 Setting Custom Prices**

### **When Adding a New Customer:**
1. **Go to Dashboard** → **Add Customer**
2. **Fill in Basic Info** (name, email, phone, etc.)
3. **Select Subscription Plan** (this sets the default price)
4. **Toggle "Use Custom Price"** switch
5. **Enter Custom Amount** in USD (e.g., $25.50)
6. **Save Customer**

### **When Editing Existing Customer:**
1. **Go to Dashboard** → **Click Edit** on customer card
2. **Toggle "Use Custom Price"** switch
3. **Enter New Custom Amount** in USD
4. **Save Changes**

### **Custom Price Guidelines:**
- **Minimum**: $0.01 (no minimum enforced)
- **Maximum**: $999.99 (no maximum enforced)
- **Decimal Places**: Up to 2 decimal places
- **Currency**: All prices in USD

## **🔄 Payment Integration with Custom Pricing**

### **Multiple Month Payments:**
- **1 Month**: Custom price × 1
- **2 Months**: Custom price × 2 (no discount)
- **3 Months**: Custom price × 3 (no discount)
- **6 Months**: Custom price × 6 (no discount)
- **12 Months**: Custom price × 12 × 0.9 (10% discount)

### **Payment Examples:**

#### **Custom Price $25/month:**
- **1 Month**: $25.00
- **2 Months**: $50.00
- **3 Months**: $75.00
- **6 Months**: $150.00
- **12 Months**: $270.00 (10% discount)

#### **Custom Price $35/month:**
- **1 Month**: $35.00
- **2 Months**: $70.00
- **3 Months**: $105.00
- **6 Months**: $210.00
- **12 Months**: $378.00 (10% discount)

## **🔍 Monitoring Custom Pricing**

### **Dashboard Indicators:**
- **Customer Cards**: Show "Custom Price" badge
- **Price Display**: Custom amount instead of plan price
- **Status Indicators**: Clear visual distinction

### **Analytics Tracking:**
- **Custom Pricing Rate**: Monitor adoption
- **Revenue Impact**: Track custom pricing contribution
- **Client Distribution**: See who uses custom pricing
- **Pricing Trends**: Track custom pricing over time

## **⚠️ Important Notes**

### **1. Data Conversion:**
- **Existing KES custom prices** will be converted to USD
- **New custom prices** should be entered in USD
- **All calculations** use USD amounts

### **2. Payment Processing:**
- **Paystack Integration** handles custom amounts correctly
- **Multiple Month Payments** calculate based on custom price
- **Discounts** apply to custom prices too
- **Webhook Processing** correctly processes custom payments

### **3. Data Consistency:**
- **Database Storage**: Custom prices stored as DECIMAL(10,2)
- **Type Safety**: TypeScript interfaces ensure data integrity
- **Validation**: Client-side and server-side validation
- **Backup**: Custom prices included in data backups

## **🚀 Best Practices**

### **1. Setting Custom Prices:**
- **Document Reasons**: Note why custom pricing was used
- **Regular Reviews**: Periodically review custom pricing
- **Market Research**: Ensure custom prices are competitive
- **Client Communication**: Clearly explain custom pricing

### **2. Managing Custom Pricing:**
- **Track Performance**: Monitor custom pricing impact
- **Client Feedback**: Get feedback on custom pricing
- **Regular Updates**: Adjust custom prices as needed
- **Documentation**: Keep records of custom pricing decisions

### **3. Analytics Usage:**
- **Monitor Trends**: Track custom pricing adoption
- **Revenue Analysis**: Understand custom pricing impact
- **Client Segmentation**: Group clients by pricing type
- **Performance Metrics**: Measure custom pricing success

## **✅ Summary**

Your custom pricing system is fully functional with the corrected USD exchange rate:

- ✅ **Flexible Pricing**: Set any USD amount for individual clients
- ✅ **Correct Exchange Rate**: 1 USD = 127.5 KES
- ✅ **Visual Indicators**: Clear display of custom vs standard pricing
- ✅ **Payment Integration**: Paystack handles custom amounts correctly
- ✅ **Analytics Tracking**: Monitor custom pricing usage and impact
- ✅ **Multiple Month Payments**: Custom pricing works with all payment options
- ✅ **Annual Discounts**: 10% discount applies to custom prices
- ✅ **Data Integrity**: Proper validation and storage

**Custom pricing gives you the flexibility to serve different client needs while maintaining accurate USD pricing based on the correct exchange rate!** 🎉
