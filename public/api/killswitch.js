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

    if (!domain) {
      return res.status(400).json({ error: 'Domain parameter is required' });
    }

    // Check if global kill switch is active
    const { data: killSwitch, error: killSwitchError } = await supabase
      .from('kill_switch')
      .select('is_active, reason')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (killSwitchError && killSwitchError.code !== 'PGRST116') {
      console.error('Error checking kill switch:', killSwitchError);
    }

    // Check specific website status
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('status, blocked_reason, customer_id')
      .eq('domain', domain)
      .single();

    if (websiteError && websiteError.code !== 'PGRST116') {
      console.error('Error checking website:', websiteError);
    }

    // Determine if website should be blocked
    const isBlocked = killSwitch?.is_active || website?.status === 'blocked';
    const reason = killSwitch?.is_active ? killSwitch.reason : website?.blocked_reason;

    return res.status(200).json({
      blocked: isBlocked,
      reason: reason || 'Website access restricted',
      timestamp: new Date().toISOString(),
      domain: domain,
      globalKillSwitch: killSwitch?.is_active || false,
      websiteBlocked: website?.status === 'blocked' || false
    });

  } catch (error) {
    console.error('Kill switch API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}