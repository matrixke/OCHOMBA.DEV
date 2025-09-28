import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  ShieldOff, 
  AlertTriangle, 
  CheckCircle, 
  Copy,
  Globe,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface KillSwitchAPIProps {
  customers: any[];
  onUpdate: () => void;
}

export function KillSwitchAPI({ customers, onUpdate }: KillSwitchAPIProps) {
  const [blockedCustomers, setBlockedCustomers] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBlockedCustomers();
    generateAPIKey();
  }, []);

  const loadBlockedCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_blocked', true)
        .order('blocked_at', { ascending: false });

      if (error) throw error;

      setBlockedCustomers(data || []);
    } catch (error) {
      console.error('Error loading blocked customers:', error);
    }
  };

  const generateAPIKey = () => {
    // Generate a simple API key for demonstration
    const key = 'ks_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(key);
  };

  const blockAllWebsites = async () => {
    setLoading(true);
    try {
      // Block all active customers
      const { error } = await supabase
        .from('customers')
        .update({
          is_blocked: true,
          blocked_reason: 'Manual kill switch activation',
          blocked_at: new Date().toISOString(),
        })
        .eq('is_active', true)
        .eq('is_blocked', false);

      if (error) throw error;

      // Update websites table
      const { error: websiteError } = await supabase
        .from('websites')
        .update({
          status: 'blocked',
          blocked_reason: 'Manual kill switch activation',
          blocked_at: new Date().toISOString(),
        })
        .eq('status', 'active');

      if (websiteError) throw websiteError;

      await loadBlockedCustomers();
      onUpdate();

      toast({
        title: "Kill Switch Activated",
        description: "All client websites have been blocked.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error activating kill switch:', error);
      toast({
        title: "Error",
        description: "Failed to activate kill switch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unblockAllWebsites = async () => {
    setLoading(true);
    try {
      // Unblock all customers
      const { error } = await supabase
        .from('customers')
        .update({
          is_blocked: false,
          blocked_reason: null,
          unblocked_at: new Date().toISOString(),
        })
        .eq('is_blocked', true);

      if (error) throw error;

      // Update websites table
      const { error: websiteError } = await supabase
        .from('websites')
        .update({
          status: 'active',
          blocked_reason: null,
          unblocked_at: new Date().toISOString(),
        })
        .eq('status', 'blocked');

      if (websiteError) throw websiteError;

      await loadBlockedCustomers();
      onUpdate();

      toast({
        title: "Kill Switch Deactivated",
        description: "All client websites have been unblocked.",
      });
    } catch (error) {
      console.error('Error deactivating kill switch:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate kill switch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyAPIKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "API Key Copied",
      description: "API key has been copied to clipboard.",
    });
  };

  const copyAPIEndpoint = () => {
    const endpoint = `${window.location.origin}/api/killswitch?key=${apiKey}`;
    navigator.clipboard.writeText(endpoint);
    toast({
      title: "API Endpoint Copied",
      description: "API endpoint has been copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl shadow-lg">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-red-900 to-orange-900 bg-clip-text text-transparent">
          Kill Switch Control
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Emergency control system to instantly block or unblock all client websites
        </p>
      </div>

      {/* API Configuration */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Zap className="h-5 w-5 text-blue-600" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                value={apiKey}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyAPIKey} variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>API Endpoint</Label>
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/api/killswitch?key=${apiKey}`}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyAPIEndpoint} variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Use this endpoint to check if a website should be blocked
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Kill Switch Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <ShieldOff className="h-5 w-5" />
              Block All Websites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 text-sm">
              Immediately block access to all client websites. This will affect all active customers.
            </p>
            <Button 
              onClick={blockAllWebsites}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Blocking...' : 'Activate Kill Switch'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Shield className="h-5 w-5" />
              Unblock All Websites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 text-sm">
              Restore access to all client websites. This will unblock all currently blocked customers.
            </p>
            <Button 
              onClick={unblockAllWebsites}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Unblocking...' : 'Deactivate Kill Switch'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Blocked Websites Status */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Currently Blocked Websites ({blockedCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {blockedCustomers.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-slate-600">No websites are currently blocked</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="font-medium text-slate-900">{customer.name}</p>
                      <p className="text-sm text-slate-600">{customer.website_url || 'No website URL'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      Blocked
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">
                      {customer.blocked_at ? new Date(customer.blocked_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Implementation Guide */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Zap className="h-5 w-5 text-blue-600" />
            Implementation Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800">For Client Websites:</h4>
            <div className="bg-slate-50 p-4 rounded-lg">
              <pre className="text-sm text-slate-700 overflow-x-auto">
{`// Add this to your client websites
async function checkWebsiteStatus() {
  const response = await fetch('/api/killswitch?key=${apiKey}');
  const data = await response.json();
  
  if (data.blocked) {
    // Show blocked message
    document.body.innerHTML = \`
      <div style="text-align: center; padding: 50px; font-family: Arial;">
        <h1>Website Temporarily Unavailable</h1>
        <p>This website is currently unavailable due to payment issues.</p>
        <p>Please contact support for assistance.</p>
      </div>
    \`;
  }
}

// Check on page load
checkWebsiteStatus();`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
