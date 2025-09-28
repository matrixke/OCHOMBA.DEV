# Kill Switch Implementation Guide

This guide explains how to implement the kill switch functionality for your client websites.

## Overview

The kill switch system allows you to instantly block or unblock all client websites when payments are overdue or other issues arise. It consists of:

1. **Dashboard Control Panel** - Manage kill switch from your admin dashboard
2. **API Endpoint** - Check kill switch status via API
3. **Client Script** - JavaScript code to add to client websites

## Setup Instructions

### 1. Database Migration

First, run the database migration to add website management and kill switch fields:

```sql
-- Run this migration in your Supabase database
-- File: supabase/migrations/20250115000001-add-website-management.sql
```

### 2. Dashboard Features

The dashboard now includes:
- **Website Management Tab** - Add and manage client websites
- **Kill Switch Tab** - Control the kill switch system
- **Customer Form** - Now includes website URL field

### 3. Client Website Implementation

To add kill switch functionality to your client websites:

#### Option A: Simple Implementation

Add this script tag to the `<head>` of your client websites:

```html
<script src="https://your-dashboard-domain.com/killswitch-client.js"></script>
<script>
  // Configure the API endpoint and key
  window.killSwitchConfig = {
    apiUrl: 'https://your-dashboard-domain.com/api/killswitch',
    apiKey: 'your-api-key-here'
  };
</script>
```

#### Option B: Custom Implementation

For more control, implement the kill switch check manually:

```javascript
// Check kill switch status
async function checkKillSwitch() {
  try {
    const response = await fetch('https://your-dashboard-domain.com/api/killswitch?key=your-api-key');
    const data = await response.json();
    
    if (data.blocked) {
      // Show blocked message
      showBlockedMessage(data.reason);
    }
  } catch (error) {
    console.error('Kill switch check failed:', error);
  }
}

// Show blocked message
function showBlockedMessage(reason) {
  document.body.innerHTML = `
    <div style="text-align: center; padding: 50px; font-family: Arial;">
      <h1>Website Temporarily Unavailable</h1>
      <p>This website is currently unavailable due to payment issues.</p>
      <p>Reason: ${reason}</p>
      <p>Please contact support for assistance.</p>
    </div>
  `;
}

// Check on page load
checkKillSwitch();
```

## API Endpoint

The kill switch API endpoint returns:

```json
{
  "blocked": true/false,
  "reason": "Payment overdue",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### API Usage

```bash
# Check kill switch status
GET /api/killswitch?key=your-api-key

# Response when blocked
{
  "blocked": true,
  "reason": "Payment overdue",
  "timestamp": "2024-01-15T10:30:00Z"
}

# Response when not blocked
{
  "blocked": false,
  "reason": null,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Dashboard Usage

### 1. Adding Websites

1. Go to the **Websites** tab
2. Click **Add Website**
3. Select a customer
4. Enter the domain name
5. Set the status (Active/Blocked/Maintenance)

### 2. Using the Kill Switch

1. Go to the **Kill Switch** tab
2. Use **Block All Websites** to instantly block all client sites
3. Use **Unblock All Websites** to restore access
4. Copy the API key and endpoint for client implementation

### 3. Individual Website Control

1. Go to the **Websites** tab
2. Find the website you want to control
3. Click **Block** or **Unblock** for individual control

## Security Considerations

1. **API Key Security**: Keep your API key secure and don't expose it in client-side code
2. **HTTPS**: Always use HTTPS for API endpoints
3. **Rate Limiting**: Implement rate limiting on your API endpoint
4. **Monitoring**: Monitor kill switch usage and set up alerts

## Advanced Features

### Automatic Blocking

The system can automatically block websites when:
- Subscription expires
- Payment is overdue
- Customer is marked as inactive

### Custom Block Messages

You can customize the blocked message by modifying the `BLOCKED_MESSAGE` variable in the client script.

### Multiple Domains

Each customer can have multiple websites. The kill switch affects all websites associated with a customer.

## Troubleshooting

### Common Issues

1. **Websites not blocking**: Check API key and endpoint URL
2. **API not responding**: Verify the endpoint is accessible
3. **Script not loading**: Check the script URL and CORS settings

### Debug Mode

Enable debug mode by adding this to your client websites:

```javascript
window.killSwitchDebug = true;
```

This will log kill switch checks to the console.

## Production Deployment

1. **Server-side API**: Implement the kill switch API as a proper server-side endpoint
2. **Database Integration**: Connect the API to your Supabase database
3. **Caching**: Add caching for better performance
4. **Monitoring**: Set up monitoring and alerting
5. **Backup**: Ensure you have a way to quickly restore access if needed

## Support

For issues or questions about the kill switch implementation, please contact your development team or refer to the dashboard documentation.
