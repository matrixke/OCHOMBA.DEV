# 🌐 Website Integration & Control Guide

## **Overview**
This guide explains how to add client websites to your app and implement control mechanisms to manage them remotely.

## **📋 What You Need to Add to Your App**

### **1. Database Tables (Already Created)**
Your app already has the necessary database structure:

```sql
-- Websites table
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  domain TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'blocked', 'maintenance'
  blocked_reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE,
  unblocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kill switch table
CREATE TABLE kill_switch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT FALSE,
  reason TEXT,
  activated_at TIMESTAMP WITH TIME ZONE,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **2. Dashboard Features (Already Implemented)**
- ✅ **Website Management Tab**: Add, edit, delete websites
- ✅ **Kill Switch Tab**: Global website control
- ✅ **Customer Form**: Website URL field
- ✅ **Automatic Blocking**: Expired subscriptions auto-block websites

## **🔧 How to Add Websites to Your App**

### **Method 1: Through Dashboard (Recommended)**

#### **Step 1: Add Website URL to Customer**
1. **Go to Dashboard** → **Add Customer** or **Edit Customer**
2. **Fill in Website URL** field with client's domain
3. **Save Customer** - This automatically creates a website entry

#### **Step 2: Manage Website in Website Management Tab**
1. **Go to Dashboard** → **Website Management** tab
2. **View All Websites** - See all client websites
3. **Add New Website** - Click "Add Website" button
4. **Edit Website** - Click edit icon on any website
5. **Block/Unblock** - Toggle website status

### **Method 2: Direct Database Entry**

```sql
-- Add a website directly to database
INSERT INTO websites (customer_id, domain, status)
VALUES (
  'customer-uuid-here',
  'example.com',
  'active'
);
```

## **🎛️ Control Mechanisms You Need to Implement**

### **1. Kill Switch API Endpoint**

Create this API endpoint to check if websites should be blocked:

```javascript
// public/api/killswitch.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { domain, apiKey } = req.query;

    // Verify API key (optional but recommended)
    if (apiKey !== process.env.KILLSWITCH_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if global kill switch is active
    const { data: killSwitch, error: killSwitchError } = await supabase
      .from('kill_switch')
      .select('is_active, reason')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (killSwitchError) {
      console.error('Error checking kill switch:', killSwitchError);
    }

    // Check specific website status
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('status, blocked_reason, customer_id')
      .eq('domain', domain)
      .single();

    if (websiteError) {
      console.error('Error checking website:', websiteError);
    }

    // Determine if website should be blocked
    const isBlocked = killSwitch?.is_active || website?.status === 'blocked';
    const reason = killSwitch?.is_active ? killSwitch.reason : website?.blocked_reason;

    return res.status(200).json({
      blocked: isBlocked,
      reason: reason || 'Website access restricted',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Kill switch API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### **2. Client-Side Script for Websites**

Create this JavaScript file for client websites:

```javascript
// public/killswitch-client.js
(function() {
  'use strict';

  // Configuration
  const config = window.killSwitchConfig || {
    apiUrl: 'https://your-dashboard-domain.com/api/killswitch',
    apiKey: 'your-api-key-here',
    checkInterval: 30000, // Check every 30 seconds
    retryAttempts: 3
  };

  let retryCount = 0;

  // Function to check kill switch status
  async function checkKillSwitch() {
    try {
      const domain = window.location.hostname;
      const response = await fetch(`${config.apiUrl}?domain=${domain}&apiKey=${config.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.blocked) {
        showBlockedMessage(data.reason);
        return true; // Stop checking
      } else {
        hideBlockedMessage();
        retryCount = 0; // Reset retry count on success
        return false;
      }

    } catch (error) {
      console.error('Kill switch check failed:', error);
      retryCount++;
      
      if (retryCount >= config.retryAttempts) {
        console.error('Max retry attempts reached. Stopping kill switch checks.');
        return true; // Stop checking
      }
      
      return false; // Continue checking
    }
  }

  // Function to show blocked message
  function showBlockedMessage(reason) {
    // Remove existing message if any
    hideBlockedMessage();

    // Create blocked message overlay
    const overlay = document.createElement('div');
    overlay.id = 'killswitch-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const message = document.createElement('div');
    message.style.cssText = `
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      text-align: center;
      max-width: 500px;
      margin: 1rem;
    `;

    message.innerHTML = `
      <div style="color: #ef4444; font-size: 4rem; margin-bottom: 1rem;">🚫</div>
      <h1 style="color: #1f2937; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">
        Website Access Restricted
      </h1>
      <p style="color: #6b7280; margin-bottom: 1.5rem;">
        ${reason || 'This website is currently unavailable due to payment issues.'}
      </p>
      <p style="color: #9ca3af; font-size: 0.875rem;">
        Please contact your service provider to restore access.
      </p>
    `;

    overlay.appendChild(message);
    document.body.appendChild(overlay);

    // Prevent scrolling
    document.body.style.overflow = 'hidden';
  }

  // Function to hide blocked message
  function hideBlockedMessage() {
    const overlay = document.getElementById('killswitch-overlay');
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = '';
    }
  }

  // Start checking kill switch status
  function startKillSwitchCheck() {
    // Check immediately
    checkKillSwitch().then(shouldStop => {
      if (!shouldStop) {
        // Set up interval for periodic checks
        const interval = setInterval(() => {
          checkKillSwitch().then(shouldStop => {
            if (shouldStop) {
              clearInterval(interval);
            }
          });
        }, config.checkInterval);
      }
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startKillSwitchCheck);
  } else {
    startKillSwitchCheck();
  }

})();
```

## **🚀 Implementation Steps**

### **Step 1: Deploy API Endpoint**
1. **Create** `public/api/killswitch.js` with the code above
2. **Set Environment Variables**:
   ```bash
   KILLSWITCH_API_KEY=your-secure-api-key-here
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### **Step 2: Deploy Client Script**
1. **Create** `public/killswitch-client.js` with the code above
2. **Update Configuration** in the script:
   ```javascript
   const config = {
     apiUrl: 'https://your-actual-domain.com/api/killswitch',
     apiKey: 'your-secure-api-key-here'
   };
   ```

### **Step 3: Add Script to Client Websites**
Add this to the `<head>` of each client website:

```html
<script src="https://your-dashboard-domain.com/killswitch-client.js"></script>
<script>
  window.killSwitchConfig = {
    apiUrl: 'https://your-dashboard-domain.com/api/killswitch',
    apiKey: 'your-secure-api-key-here'
  };
</script>
```

### **Step 4: Test the System**
1. **Add a test website** through the dashboard
2. **Block the website** using the kill switch
3. **Visit the website** - it should show the blocked message
4. **Unblock the website** - it should work normally

## **🎛️ Control Features Available**

### **Individual Website Control:**
- ✅ **Block/Unblock** specific websites
- ✅ **Set Blocking Reason** (payment overdue, maintenance, etc.)
- ✅ **View Status** and blocking history
- ✅ **Edit Website Details**

### **Global Kill Switch:**
- ✅ **Block All Websites** instantly
- ✅ **Set Global Reason** for blocking
- ✅ **Emergency Control** for system-wide issues
- ✅ **Automatic Activation** on payment failures

### **Automatic Management:**
- ✅ **Auto-Block** expired subscriptions
- ✅ **Auto-Unblock** successful payments
- ✅ **Scheduled Checks** for subscription status
- ✅ **Real-time Updates** via webhooks

## **🔒 Security Considerations**

### **API Security:**
- **API Key Authentication**: Protect your kill switch API
- **Rate Limiting**: Prevent abuse of the API
- **CORS Headers**: Proper cross-origin configuration
- **Input Validation**: Validate all incoming requests

### **Client Security:**
- **HTTPS Only**: Always use secure connections
- **Domain Validation**: Verify requests are from legitimate domains
- **Error Handling**: Graceful failure without exposing sensitive data

## **📊 Monitoring & Analytics**

### **Dashboard Metrics:**
- **Total Websites**: Number of managed websites
- **Blocked Websites**: Currently blocked count
- **Blocking Reasons**: Most common blocking reasons
- **Uptime Statistics**: Website availability metrics

### **Logging:**
- **Block/Unblock Events**: Complete audit trail
- **API Usage**: Track kill switch API calls
- **Error Logs**: Monitor system health
- **Performance Metrics**: Response times and reliability

---

## **🎯 Quick Start Checklist**

- [ ] **Deploy kill switch API** (`public/api/killswitch.js`)
- [ ] **Deploy client script** (`public/killswitch-client.js`)
- [ ] **Set environment variables** (API keys, Supabase credentials)
- [ ] **Add websites** through dashboard
- [ ] **Test blocking/unblocking** functionality
- [ ] **Add script to client websites**
- [ ] **Configure monitoring** and alerts
- [ ] **Train team** on kill switch usage

**You now have complete control over all client websites with professional blocking capabilities!** 🎉
