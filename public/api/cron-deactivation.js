// Cron Job API for Automatic Deactivation
// This endpoint runs daily to automatically deactivate expired subscriptions

import { createClient } from '@supabase/supabase-js';

// Ensure these are set as environment variables in your deployment platform
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the request is from a legitimate source (optional but recommended)
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CRON_SECRET_TOKEN;
  
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting automatic deactivation process...');

    // Run the automatic deactivation function
    const { data, error } = await supabase.rpc('auto_deactivate_expired_subscriptions');

    if (error) {
      console.error('Error running automatic deactivation:', error);
      return res.status(500).json({ 
        error: 'Failed to run automatic deactivation',
        details: error.message 
      });
    }

    // Get statistics about what was deactivated
    const { data: expiredCustomers, error: expiredError } = await supabase
      .rpc('get_expired_customers');

    if (expiredError) {
      console.error('Error fetching expired customers:', expiredError);
    }

    // Get expiring customers for next 7 days
    const { data: expiringCustomers, error: expiringError } = await supabase
      .rpc('check_expiring_subscriptions');

    if (expiringError) {
      console.error('Error fetching expiring customers:', expiringError);
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      deactivated: expiredCustomers?.length || 0,
      expiring: expiringCustomers?.length || 0,
      message: `Automatic deactivation completed. ${expiredCustomers?.length || 0} customers deactivated, ${expiringCustomers?.length || 0} expiring soon.`
    };

    console.log('Automatic deactivation completed:', result);

    res.status(200).json(result);

  } catch (error) {
    console.error('Cron job error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// For Vercel Edge Runtime (optional)
export const config = {
  runtime: 'nodejs',
};
