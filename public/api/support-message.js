import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { domain, message, email, timestamp, userAgent, url } = req.body;

    if (!domain || !message) {
      return res.status(400).json({ error: 'Domain and message are required' });
    }

    // Insert support message into database
    const { data, error } = await supabase
      .from('support_messages')
      .insert([{
        domain: domain,
        message: message,
        email: email || null,
        user_agent: userAgent || null,
        page_url: url || null,
        status: 'new',
        created_at: timestamp || new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error inserting support message:', error);
      return res.status(500).json({ error: 'Failed to save message' });
    }

    console.log(`Support message received from ${domain}:`, message);

    return res.status(200).json({ 
      success: true, 
      messageId: data.id,
      message: 'Support message received successfully' 
    });

  } catch (error) {
    console.error('Support message API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
