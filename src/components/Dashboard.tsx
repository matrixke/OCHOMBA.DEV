import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CustomerForm } from './CustomerForm';
import { CustomerCard } from './CustomerCard';
import { Analytics } from './Analytics';
import { WebsiteManagement } from './WebsiteManagement';
import { KillSwitchAPI } from './KillSwitchAPI';
import { PaystackIntegration } from './PaystackIntegration';
import { AutomaticDeactivation } from './AutomaticDeactivation';
import { SupportMessages } from './SupportMessages';
import { Customer, Revenue, SUBSCRIPTION_PLANS } from '@/types/customer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Users, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Search,
  Building2,
  Target,
  Zap,
  Shield,
  Globe,
  ShieldOff,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';

export function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaystackIntegration, setShowPaystackIntegration] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
    loadRevenues();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCustomers(data.map(customer => ({
        id: customer.id,
        businessName: customer.name,
        systemName: customer.name,
        email: customer.phone, // Using phone as email for now
        phone: customer.phone,
        whatsapp: customer.whatsapp,
        websiteUrl: customer.website_url,
        subscriptionPlan: customer.subscription_type,
        subscriptionStart: new Date(customer.subscription_start_date),
        subscriptionEndDate: customer.subscription_end_date ? new Date(customer.subscription_end_date) : undefined,
        isActive: customer.is_active,
        isRegularClient: true, // Default value
        isBlocked: customer.is_blocked,
        blockedReason: customer.blocked_reason,
        blockedAt: customer.blocked_at ? new Date(customer.blocked_at) : undefined,
        unblockedAt: customer.unblocked_at ? new Date(customer.unblocked_at) : undefined,
        customPrice: customer.custom_price,
        useCustomPrice: customer.use_custom_price,
        createdAt: new Date(customer.created_at),
      })));
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRevenues = async () => {
    try {
      const { data, error } = await supabase
        .from('revenue')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setRevenues(data);
    } catch (error) {
      console.error('Error loading revenues:', error);
    }
  };

  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    try {
      // Use the price directly from the form
      const finalPrice = customerData.price || 0;

      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customerData.businessName,
          phone: customerData.phone,
          whatsapp: customerData.phone,
          website_url: customerData.websiteUrl,
          subscription_type: customerData.subscriptionPlan,
          subscription_start_date: customerData.subscriptionStart.toISOString().split('T')[0],
          subscription_end_date: new Date(customerData.subscriptionStart.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: finalPrice,
          custom_price: null,
          use_custom_price: false,
          is_active: customerData.isActive,
          is_blocked: false,
        }])
        .select()
        .single();

      if (error) throw error;

      // Automatically add revenue record for the subscription
      try {
        const { error: revenueError } = await supabase
          .from('revenue')
          .insert([{
            amount: finalPrice,
            date: customerData.subscriptionStart.toISOString().split('T')[0],
            description: `Subscription payment - ${customerData.businessName} (${customerData.subscriptionPlan})`,
          }]);

        if (revenueError) {
          console.warn('Warning: Could not create revenue record:', revenueError);
        }
      } catch (revenueError) {
        console.warn('Warning: Could not create revenue record:', revenueError);
      }

      // Reload customers and revenues to get the new data
      await loadCustomers();
      await loadRevenues();
      
      toast({
        title: "Success",
        description: "Customer added successfully with revenue tracking!",
      });
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    if (!editingCustomer) return;
    
    try {
      // Use the price directly from the form
      const finalPrice = customerData.price || 0;

      const { error } = await supabase
        .from('customers')
        .update({
          name: customerData.businessName,
          phone: customerData.phone,
          whatsapp: customerData.phone,
          website_url: customerData.websiteUrl,
          subscription_type: customerData.subscriptionPlan,
          subscription_start_date: customerData.subscriptionStart.toISOString().split('T')[0],
          subscription_end_date: new Date(customerData.subscriptionStart.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: finalPrice,
          custom_price: null,
          use_custom_price: false,
          is_active: customerData.isActive,
        })
        .eq('id', editingCustomer.id);

      if (error) throw error;

      // Reload customers to get the updated data
      await loadCustomers();
      setEditingCustomer(null);
      
      toast({
        title: "Success",
        description: "Customer updated successfully!",
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (customerId: string) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      const { error } = await supabase
        .from('customers')
        .update({ is_active: !customer.isActive })
        .eq('id', customerId);

      if (error) throw error;

      // Reload customers to get the updated data
      await loadCustomers();
      
      toast({
        title: "Success",
        description: `Customer ${customer.isActive ? 'deactivated' : 'activated'} successfully!`,
      });
    } catch (error) {
      console.error('Error toggling customer status:', error);
      toast({
        title: "Error",
        description: "Failed to update customer status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddRevenue = async (revenueData: Omit<Revenue, 'id'>) => {
    try {
      const { error } = await supabase
        .from('revenue')
        .insert([{
          amount: revenueData.amount,
          date: revenueData.date.toISOString().split('T')[0],
          description: revenueData.description,
        }]);

      if (error) throw error;

      // Reload revenues to get the new data
      await loadRevenues();
      
      toast({
        title: "Success",
        description: "Revenue record added successfully!",
      });
    } catch (error) {
      console.error('Error adding revenue:', error);
      toast({
        title: "Error",
        description: "Failed to add revenue record. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleSendPayment = (customer: Customer) => {
    setSelectedCustomerForPayment(customer);
    setShowPaystackIntegration(true);
  };

  const closePaystackIntegration = () => {
    setShowPaystackIntegration(false);
    setSelectedCustomerForPayment(null);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.systemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.subscriptionPlan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const activeCustomers = customers.filter(c => c.isActive).length;
  
  // Calculate total revenue from active subscriptions and revenue records
  const totalSubscriptionRevenue = customers
    .filter(c => c.isActive)
    .reduce((total, customer) => {
      // Use the price from the customer object (set in database)
      const price = customer.price || 0;
      return total + price;
    }, 0);
  
  const totalOneTimeRevenue = revenues.reduce((total, r) => total + r.amount, 0);
  const totalRevenue = totalSubscriptionRevenue + totalOneTimeRevenue;
  
  const expiringThisWeek = customers.filter(customer => {
    const now = new Date();
    const subscriptionEnd = new Date(customer.subscriptionStart);
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    const daysUntilExpiry = Math.ceil((subscriptionEnd.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0 && customer.isActive;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg mb-4 animate-bounce-in animate-float">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            OCHOMBA.DEV Client Manager
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Professional SaaS client management with advanced subscription tracking and revenue analytics
          </p>
          <Button 
            onClick={() => setShowForm(true)} 
            className="gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 animate-scale-in animate-glow"
          >
            <Plus className="h-5 w-5" />
            Add New Client
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Clients</CardTitle>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{customers.length}</div>
              <p className="text-xs text-slate-500 mt-1">Active & inactive clients</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Active Subscriptions</CardTitle>
              <div className="p-3 bg-green-100 rounded-xl">
                <Target className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeCustomers}</div>
              <p className="text-xs text-slate-500 mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Expiring This Week</CardTitle>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{expiringThisWeek}</div>
              <p className="text-xs text-slate-500 mt-1">Need renewal</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Current Month Revenue</CardTitle>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">
                $ {(() => {
                  const currentMonth = new Date();
                  const currentMonthRevenue = revenues
                    .filter(r => {
                      const revenueDate = new Date(r.date);
                      return revenueDate.getMonth() === currentMonth.getMonth() && 
                             revenueDate.getFullYear() === currentMonth.getFullYear();
                    })
                    .reduce((total, r) => total + r.amount, 0);
                  
                  const currentMonthSubscriptionRevenue = customers
                    .filter(customer => customer.isActive)
                    .reduce((total, customer) => {
                      const startDate = new Date(customer.subscriptionStart);
                      const endDate = new Date(customer.subscriptionEndDate || startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                      
                      if (startDate <= monthEnd && endDate >= monthStart) {
                        // Use the price from the customer object (set in database)
      const price = customer.price || 0;
                        return total + price;
                      }
                      return total;
                    }, 0);
                  
                  return (currentMonthRevenue + currentMonthSubscriptionRevenue).toLocaleString();
                })()}
              </div>
              <p className="text-xs text-slate-500 mt-1">This month's earnings</p>
            </CardContent>
          </Card>
        </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="clients" className="w-full animate-fade-in-up">
            <TabsList className="grid w-full grid-cols-6 max-w-6xl mx-auto bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <TabsTrigger value="clients" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <Users className="h-4 w-4 mr-2" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="websites" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <Globe className="h-4 w-4 mr-2" />
                Websites
              </TabsTrigger>
              <TabsTrigger value="killswitch" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <Shield className="h-4 w-4 mr-2" />
                Kill Switch
              </TabsTrigger>
              <TabsTrigger value="deactivation" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <Zap className="h-4 w-4 mr-2" />
                Auto Deactivation
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <MessageCircle className="h-4 w-4 mr-2" />
                Support
              </TabsTrigger>
            </TabsList>
          
          <TabsContent value="clients" className="space-y-6 mt-8">
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search clients by name, system, or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-xl text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
              />
            </div>

            {/* Client Cards */}
            {filteredCustomers.length === 0 ? (
              <Card className="text-center py-16 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="space-y-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <Users className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800">No clients found</h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first client to begin managing subscriptions.'}
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setShowForm(true)} 
                      className="gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your First Client
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredCustomers.map((customer) => (
                   <CustomerCard
                     key={customer.id}
                     customer={customer}
                     onToggleStatus={handleToggleStatus}
                     onEdit={openEditForm}
                     onSendPayment={handleSendPayment}
                   />
                 ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="websites" className="mt-8">
            <WebsiteManagement 
              customers={customers} 
              onCustomerUpdate={loadCustomers}
            />
          </TabsContent>

            <TabsContent value="killswitch" className="mt-8">
              <KillSwitchAPI 
                customers={customers} 
                onUpdate={loadCustomers}
              />
            </TabsContent>

            <TabsContent value="deactivation" className="mt-8">
              <AutomaticDeactivation />
            </TabsContent>

            <TabsContent value="analytics" className="mt-8">
              <Analytics 
                customers={customers} 
                revenues={revenues} 
                onAddRevenue={handleAddRevenue} 
              />
            </TabsContent>

            <TabsContent value="support" className="mt-8">
              <SupportMessages />
            </TabsContent>
        </Tabs>

        {/* Customer Form Dialog */}
        <CustomerForm
          isOpen={showForm}
          onClose={closeForm}
          onSave={editingCustomer ? handleEditCustomer : handleAddCustomer}
          editingCustomer={editingCustomer}
        />

        {/* Paystack Integration Dialog */}
        {selectedCustomerForPayment && (
          <PaystackIntegration
            customer={selectedCustomerForPayment}
            onClose={closePaystackIntegration}
          />
        )}
      </div>
    </div>
  );
}