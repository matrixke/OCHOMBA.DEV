-- Create support_messages table for customer support messages
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  message TEXT NOT NULL,
  email TEXT,
  user_agent TEXT,
  page_url TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
  admin_notes TEXT,
  admin_reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  replied_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for domain lookups
CREATE INDEX IF NOT EXISTS idx_support_messages_domain ON support_messages(domain);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON support_messages(status);

-- Create index for date filtering
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to insert messages
CREATE POLICY "Allow service role to insert support messages" ON support_messages
  FOR INSERT WITH CHECK (true);

-- Policy to allow service role to read all messages
CREATE POLICY "Allow service role to read support messages" ON support_messages
  FOR SELECT USING (true);

-- Policy to allow service role to update messages
CREATE POLICY "Allow service role to update support messages" ON support_messages
  FOR UPDATE USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_support_messages_updated_at
  BEFORE UPDATE ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_support_messages_updated_at();

-- Function to update replied_at when admin_reply is set
CREATE OR REPLACE FUNCTION update_support_messages_replied_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.admin_reply IS NOT NULL AND OLD.admin_reply IS NULL THEN
    NEW.replied_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set replied_at
CREATE TRIGGER update_support_messages_replied_at
  BEFORE UPDATE ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_support_messages_replied_at();

-- Function to update closed_at when status is set to 'closed'
CREATE OR REPLACE FUNCTION update_support_messages_closed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set closed_at
CREATE TRIGGER update_support_messages_closed_at
  BEFORE UPDATE ON support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_support_messages_closed_at();

-- Add comments for documentation
COMMENT ON TABLE support_messages IS 'Customer support messages from blocked websites';
COMMENT ON COLUMN support_messages.domain IS 'Website domain that sent the message';
COMMENT ON COLUMN support_messages.message IS 'Customer message content';
COMMENT ON COLUMN support_messages.email IS 'Customer email (optional)';
COMMENT ON COLUMN support_messages.status IS 'Message status: new, read, replied, closed';
COMMENT ON COLUMN support_messages.admin_notes IS 'Internal admin notes';
COMMENT ON COLUMN support_messages.admin_reply IS 'Admin response to customer';
