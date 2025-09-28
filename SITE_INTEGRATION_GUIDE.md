# 🌐 Complete Site Integration Guide

## Overview
This guide will help you implement the OCHOMBA.DEV site integration system on your client websites. The system automatically blocks/unblocks websites based on subscription status and provides a support messaging system.

## 📋 What You Need

### 1. Files Created
- ✅ `public/site-integration.js` - Client-side integration script
- ✅ `public/api/support-message.js` - Support message API endpoint
- ✅ `supabase/migrations/20250115000002-add-support-messages.sql` - Database migration
- ✅ `src/components/SupportMessages.tsx` - Dashboard support management
- ✅ Updated Dashboard with Support tab

### 2. Database Setup
Run the migration to create the support messages table:
```sql
-- Run this in your Supabase SQL editor
-- File: supabase/migrations/20250115000002-add-support-messages.sql
```

## 🚀 Implementation Steps

### Step 1: Deploy Your Dashboard
1. Deploy your dashboard to a public URL (e.g., `https://your-dashboard.vercel.app`)
2. Ensure the API endpoints are accessible:
   - `https://your-dashboard.vercel.app/api/killswitch`
   - `https://your-dashboard.vercel.app/api/support-message`

### Step 2: Get Your API Key
1. Go to your dashboard → Kill Switch tab
2. Generate or copy your API key
3. Keep this key secure - you'll need it for each website

### Step 3: Add Integration Code to Client Websites

#### Method 1: Direct Script Inclusion (Recommended)
Add this code to your client's website HTML before the closing `</body>` tag:

```html
<!-- OCHOMBA.DEV Site Integration -->
<script src="https://your-dashboard.vercel.app/site-integration.js"></script>
<script>
  OCHOMBASiteIntegration.init({
    domain: 'client-domain.com',
    apiKey: 'your-api-key-here',
    dashboardUrl: 'https://your-dashboard.vercel.app'
  });
</script>
```

#### Method 2: WordPress Plugin (Custom)
Create a simple WordPress plugin:

```php
<?php
/*
Plugin Name: OCHOMBA.DEV Integration
Description: Automatic website blocking/unblocking based on subscription status
Version: 1.0
*/

function ochomba_integration_script() {
    ?>
    <script src="https://your-dashboard.vercel.app/site-integration.js"></script>
    <script>
      OCHOMBASiteIntegration.init({
        domain: '<?php echo $_SERVER['HTTP_HOST']; ?>',
        apiKey: 'your-api-key-here',
        dashboardUrl: 'https://your-dashboard.vercel.app'
      });
    </script>
    <?php
}
add_action('wp_footer', 'ochomba_integration_script');
?>
```

#### Method 3: React/Next.js Component
```jsx
import { useEffect } from 'react';

export default function OCHOMBAIntegration() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://your-dashboard.vercel.app/site-integration.js';
    script.onload = () => {
      window.OCHOMBASiteIntegration.init({
        domain: window.location.hostname,
        apiKey: 'your-api-key-here',
        dashboardUrl: 'https://your-dashboard.vercel.app'
      });
    };
    document.body.appendChild(script);
  }, []);

  return null;
}
```

## 🔧 Configuration Options

### Basic Configuration
```javascript
OCHOMBASiteIntegration.init({
  domain: 'example.com',           // Required: Website domain
  apiKey: 'your-api-key',          // Required: Your API key
  dashboardUrl: 'https://your-dashboard.vercel.app'  // Required: Dashboard URL
});
```

### Advanced Configuration (Optional)
```javascript
OCHOMBASiteIntegration.init({
  domain: 'example.com',
  apiKey: 'your-api-key',
  dashboardUrl: 'https://your-dashboard.vercel.app',
  // Optional customizations:
  checkInterval: 30000,    // Check status every 30 seconds (default)
  retryAttempts: 3,        // Retry failed requests 3 times (default)
  retryDelay: 5000         // Wait 5 seconds between retries (default)
});
```

## 🎨 Customization

### Custom Block Overlay Styling
The integration script creates a beautiful animated overlay when a site is blocked. You can customize it by adding CSS:

```css
/* Custom styles for the block overlay */
#ochomba-block-overlay {
  background: linear-gradient(135deg, #your-color-1, #your-color-2) !important;
}

#ochomba-block-overlay h1 {
  color: #your-text-color !important;
}
```

### Custom Support Modal
The support modal can be customized by modifying the `openSupportModal()` function in `site-integration.js`.

## 📱 Features

### Automatic Blocking/Unblocking
- ✅ Checks subscription status every 30 seconds
- ✅ Automatically blocks websites when subscription expires
- ✅ Automatically unblocks when payment is received
- ✅ Handles network failures gracefully with retry logic

### Support System
- ✅ Beautiful animated block overlay
- ✅ Contact support button with modal
- ✅ Messages automatically tagged with domain name
- ✅ Admin dashboard to manage support messages
- ✅ Email notifications (optional)

### Security Features
- ✅ API key authentication
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection protection

## 🔍 Testing

### Test Blocking
1. Add a test website to your dashboard
2. Set its status to "blocked" in Website Management
3. Visit the website - you should see the block overlay

### Test Support Messages
1. Click "Contact Support" on a blocked website
2. Send a test message
3. Check your dashboard → Support tab
4. Reply to the message

### Test Unblocking
1. Set website status to "active" in dashboard
2. Refresh the website - overlay should disappear

## 🚨 Troubleshooting

### Common Issues

#### 1. Script Not Loading
- Check that your dashboard URL is correct
- Ensure the script is accessible: `https://your-dashboard.vercel.app/site-integration.js`
- Check browser console for errors

#### 2. API Errors
- Verify your API key is correct
- Check that the domain matches exactly (no www vs non-www)
- Ensure CORS is properly configured

#### 3. Block Overlay Not Showing
- Check browser console for JavaScript errors
- Verify the domain is registered in your dashboard
- Test the API endpoint directly: `https://your-dashboard.vercel.app/api/killswitch?domain=example.com&apiKey=your-key`

#### 4. Support Messages Not Appearing
- Check the support-message API endpoint
- Verify database migration was run
- Check Supabase logs for errors

### Debug Mode
Add this to enable debug logging:
```javascript
window.OCHOMBA_CONFIG = {
  domain: 'example.com',
  apiKey: 'your-api-key',
  dashboardUrl: 'https://your-dashboard.vercel.app',
  debug: true  // Enable debug logging
};
```

## 📊 Monitoring

### Dashboard Metrics
- View support messages in the Support tab
- Track website status in Website Management
- Monitor payment status in Analytics

### Logs
- Check browser console for client-side errors
- Check Supabase logs for server-side errors
- Monitor API endpoint responses

## 🔐 Security Best Practices

1. **API Key Management**
   - Use different API keys for different clients
   - Rotate keys regularly
   - Never expose keys in client-side code

2. **Domain Validation**
   - Always validate domains server-side
   - Use HTTPS for all communications
   - Implement rate limiting

3. **Data Protection**
   - Encrypt sensitive data
   - Use secure headers
   - Regular security audits

## 🎯 Next Steps

1. **Deploy your dashboard** to a public URL
2. **Run the database migration** in Supabase
3. **Test the integration** with a sample website
4. **Add the script** to your client websites
5. **Monitor and maintain** the system

## 📞 Support

If you need help with implementation:
1. Check the troubleshooting section above
2. Review the browser console for errors
3. Test API endpoints manually
4. Check Supabase logs for server errors

---

**Remember**: Always test the integration thoroughly before deploying to production websites!
