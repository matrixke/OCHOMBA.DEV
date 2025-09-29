import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Globe, 
  Shield, 
  ShieldOff, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Zap
} from 'lucide-react';
import { Customer, Website } from '@/types/customer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface WebsiteManagementProps {
  customers: Customer[];
  onCustomerUpdate: () => void;
}

export function WebsiteManagement({ customers, onCustomerUpdate }: WebsiteManagementProps) {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customerId: '',
    domain: '',
    status: 'active' as 'active' | 'blocked' | 'maintenance'
  });
  const [integrationSnippet, setIntegrationSnippet] = useState<string | null>(null);

  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWebsites(data.map(website => ({
        id: website.id,
        customerId: website.customer_id,
        domain: website.domain,
        status: website.status as 'active' | 'blocked' | 'maintenance',
        blockedReason: website.blocked_reason,
        blockedAt: website.blocked_at ? new Date(website.blocked_at) : undefined,
        unblockedAt: website.unblocked_at ? new Date(website.unblocked_at) : undefined,
        createdAt: new Date(website.created_at),
        updatedAt: new Date(website.updated_at),
      })));
    } catch (error) {
      console.error('Error loading websites:', error);
      toast({
        title: "Error",
        description: "Failed to load websites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebsite = async () => {
    if (!formData.customerId || !formData.domain) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('websites')
        .insert([{
          customer_id: formData.customerId,
          domain: formData.domain,
          status: formData.status,
        }]);

      if (error) throw error;

      await loadWebsites();
      onCustomerUpdate();
      setShowAddDialog(false);
      setFormData({ customerId: '', domain: '', status: 'active' });

      // Generate integration snippet for universal control
      const snippet = `<script src="https://ochomba.dev/killswitch-client.js" data-domain="${formData.domain}" data-api-key="YOUR_API_KEY"></script>\n<!-- Add this to your site's <head> or main template. Works with any framework. -->`;
      setIntegrationSnippet(snippet);

      toast({
        title: "Success",
        description: "Website added successfully! See integration instructions below.",
      });
    } catch (error) {
      console.error('Error adding website:', error);
      toast({
        title: "Error",
        description: "Failed to add website. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBlockWebsite = async (websiteId: string, reason: string = 'Payment overdue') => {
    try {
      const website = websites.find(w => w.id === websiteId);
      if (!website) return;

      // Block the website
      const { error: websiteError } = await supabase
        .from('websites')
        .update({
          status: 'blocked',
          blocked_reason: reason,
          blocked_at: new Date().toISOString(),
        })
        .eq('id', websiteId);

      if (websiteError) throw websiteError;

      // Block the customer
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          is_blocked: true,
          blocked_reason: reason,
          blocked_at: new Date().toISOString(),
        })
        .eq('id', website.customerId);

      if (customerError) throw customerError;

      await loadWebsites();
      onCustomerUpdate();

      toast({
        title: "Website Blocked",
        description: "Website access has been blocked due to payment issues.",
      });
    } catch (error) {
      console.error('Error blocking website:', error);
      toast({
        title: "Error",
        description: "Failed to block website. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnblockWebsite = async (websiteId: string) => {
    try {
      const website = websites.find(w => w.id === websiteId);
      if (!website) return;

      // Unblock the website
      const { error: websiteError } = await supabase
        .from('websites')
        .update({
          status: 'active',
          blocked_reason: null,
          unblocked_at: new Date().toISOString(),
        })
        .eq('id', websiteId);

      if (websiteError) throw websiteError;

      // Unblock the customer
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          is_blocked: false,
          blocked_reason: null,
          unblocked_at: new Date().toISOString(),
        })
        .eq('id', website.customerId);

      if (customerError) throw customerError;

      await loadWebsites();
      onCustomerUpdate();

      toast({
        title: "Website Unblocked",
        description: "Website access has been restored.",
      });
    } catch (error) {
      console.error('Error unblocking website:', error);
      toast({
        title: "Error",
        description: "Failed to unblock website. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWebsite = async (websiteId: string) => {
    try {
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', websiteId);

      if (error) throw error;

      await loadWebsites();
      onCustomerUpdate();

      toast({
        title: "Website Deleted",
        description: "Website has been removed from management.",
      });
    } catch (error) {
      console.error('Error deleting website:', error);
      toast({
        title: "Error",
        description: "Failed to delete website. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'blocked':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <ShieldOff className="h-3 w-3 mr-1" />
            Blocked
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Maintenance
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.businessName : 'Unknown Customer';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
  <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Website Management</h2>
          <p className="text-slate-600">Manage client websites and control access with kill switch</p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Website
        </Button>
      </div>

      {/* Website Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {websites.map((website) => (
          <Card key={website.id} className="group bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-900 truncate">{website.domain}</h3>
                  </div>
                  <p className="text-sm text-slate-600">{getCustomerName(website.customerId)}</p>
                </div>
                {getStatusBadge(website.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Website Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                  <a 
                    href={`https://${website.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
                
                {website.blockedReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Blocked Reason:</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">{website.blockedReason}</p>
                    {website.blockedAt && (
                      <p className="text-xs text-red-500 mt-1">
                        Blocked: {website.blockedAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {website.status === 'blocked' ? (
                  <Button
                    size="sm"
                    onClick={() => handleUnblockWebsite(website.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Unblock
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBlockWebsite(website.id)}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <ShieldOff className="h-3 w-3 mr-1" />
                    Block
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteWebsite(website.id)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Website Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Add Website
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <select
                id="customer"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.businessName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              />
              <span className="text-xs text-slate-500">Enter the root domain (e.g., mysite.com). Subdomains supported.</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'blocked' | 'maintenance' })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWebsite}>
              Add Website
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Integration Instructions after adding a site */}
      {integrationSnippet && (
        <div className="p-4 mt-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-700 mb-2">Universal Integration Snippet</h3>
          <p className="text-sm text-slate-700 mb-2">Add this code to your site's <code>&lt;head&gt;</code> or main template. Works with any framework (React, Vue, Angular, WordPress, etc.).</p>
          <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto mb-2">{integrationSnippet}</pre>
          <Button
            size="sm"
            className="bg-blue-600 text-white"
            onClick={() => navigator.clipboard.writeText(integrationSnippet)}
          >
            Copy Snippet
          </Button>
        </div>
      )}
    </div>
  );
}
