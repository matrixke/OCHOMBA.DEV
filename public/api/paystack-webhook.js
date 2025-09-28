import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

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

  // Verify Paystack webhook signature
  const hash = crypto.createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    console.warn('Webhook signature verification failed.');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body;

  if (event.event === 'charge.success') {
    const { customer: paystackCustomer, amount, reference, metadata } = event.data;
    const customerId = metadata?.customer_id;
    const businessName = metadata?.business_name;
    const monthsPaid = parseInt(metadata?.months_paid) || 1; // Default to 1 month
    const paidAmount = amount / 100; // Convert from cents to USD

    if (!customerId) {
      console.error('Paystack webhook: customer_id not found in metadata.', metadata);
      return res.status(400).json({ error: 'customer_id missing in metadata' });
    }

    try {
      console.log(`Processing payment for ${businessName}: $${paidAmount} for ${monthsPaid} month(s)`);

      // 1. Get current customer data
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Calculate new subscription end date
      let newSubscriptionEndDate = new Date();
      
      // If customer has an existing subscription end date in the future, extend from there
      if (existingCustomer.subscription_end_date && new Date(existingCustomer.subscription_end_date) > newSubscriptionEndDate) {
        newSubscriptionEndDate = new Date(existingCustomer.subscription_end_date);
      }
      
      // Add the paid months
      newSubscriptionEndDate.setMonth(newSubscriptionEndDate.getMonth() + monthsPaid);

      // 3. Update customer subscription
      const { error: updateCustomerError } = await supabase
        .from('customers')
        .update({
          is_active: true,
          is_blocked: false,
          blocked_reason: null,
          blocked_at: null,
          unblocked_at: new Date().toISOString(),
          subscription_end_date: newSubscriptionEndDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (updateCustomerError) {
        console.error('Error updating customer subscription:', updateCustomerError);
        return res.status(500).json({ error: 'Failed to update customer subscription' });
      }

      // 4. Unblock customer's websites
      const { error: unblockError } = await supabase.rpc('unblock_customer_websites', { 
        customer_id_param: customerId 
      });
      
      if (unblockError) {
        console.error('Error unblocking customer websites:', unblockError);
        // Continue even if unblock fails
      }

      // 5. Add revenue record
      const { error: revenueError } = await supabase.from('revenue').insert([{
        amount: paidAmount,
        date: new Date().toISOString().split('T')[0],
        description: `Paystack payment for ${businessName} - ${monthsPaid} month(s) (Ref: ${reference})`,
        client_id: customerId,
        type: 'subscription',
        months_paid: monthsPaid, // Track how many months were paid
        payment_reference: reference
      }]);

      if (revenueError) {
        console.error('Error adding revenue record:', revenueError);
        return res.status(500).json({ error: 'Failed to add revenue record' });
      }

      console.log(`Successfully processed payment: ${businessName} extended until ${newSubscriptionEndDate.toISOString().split('T')[0]}`);
      
      return res.status(200).json({ 
        message: 'Payment processed successfully',
        subscription_end_date: newSubscriptionEndDate.toISOString().split('T')[0],
        months_paid: monthsPaid
      });

    } catch (error) {
      console.error('Error processing Paystack webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(200).json({ message: 'Event received, but not handled' });
}