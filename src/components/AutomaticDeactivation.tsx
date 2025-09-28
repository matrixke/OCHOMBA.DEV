import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Zap,
  Calendar,
  Users,
  ShieldOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ExpiringCustomer {
  customer_id: string;
  business_name: string;
  days_remaining: number;
  subscription_end_date: string;
  email: string;
  phone: string;
}

interface ExpiredCustomer {
  customer_id: string;
  business_name: string;
  subscription_end_date: string;
  days_overdue: number;
  email: string;
  phone: string;
}

export function AutomaticDeactivation() {
  const [expiringCustomers, setExpiringCustomers] = useState<ExpiringCustomer[]>([]);
  const [expiredCustomers, setExpiredCustomers] = useState<ExpiredCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    checkExpiringAndExpired();
  }, []);

  const checkExpiringAndExpired = async () => {
    setLoading(true);
    try {
      // Check expiring subscriptions (next 7 days)
      const { data: expiringData, error: expiringError } = await supabase
        .rpc('check_expiring_subscriptions');

      if (expiringError) throw expiringError;
      setExpiringCustomers(expiringData || []);

      // Check expired subscriptions
      const { data: expiredData, error: expiredError } = await supabase
        .rpc('get_expired_customers');

      if (expiredError) throw expiredError;
      setExpiredCustomers(expiredData || []);

      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to check subscription status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runAutomaticDeactivation = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('auto_deactivate_expired_subscriptions');
      
      if (error) throw error;

      toast({
        title: "Automatic Deactivation Complete",
        description: "All expired subscriptions have been deactivated and websites blocked.",
      });

      // Refresh the data
      await checkExpiringAndExpired();
    } catch (error) {
      console.error('Error running automatic deactivation:', error);
      toast({
        title: "Error",
        description: "Failed to run automatic deactivation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (daysRemaining: number) => {
    if (daysRemaining <= 0) {
      return <Badge className="bg-red-100 text-red-700 border-red-200">Expired</Badge>;
    } else if (daysRemaining <= 3) {
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Critical</Badge>;
    } else if (daysRemaining <= 7) {
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Warning</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>;
    }
  };

  const getDaysOverdueBadge = (daysOverdue: number) => {
    if (daysOverdue <= 7) {
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200">{daysOverdue} days overdue</Badge>;
    } else if (daysOverdue <= 30) {
      return <Badge className="bg-red-100 text-red-700 border-red-200">{daysOverdue} days overdue</Badge>;
    } else {
      return <Badge className="bg-red-200 text-red-800 border-red-300">{daysOverdue} days overdue</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl shadow-lg">
          <Zap className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-orange-900 to-red-900 bg-clip-text text-transparent">
          Automatic Deactivation
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Monitor and automatically deactivate expired subscriptions to ensure timely payments.
        </p>
      </div>

      {/* Control Panel */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Deactivation Control Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="space-y-1">
              <h3 className="font-medium text-orange-800">Run Automatic Deactivation</h3>
              <p className="text-sm text-orange-600">
                This will deactivate all expired subscriptions and block their websites.
              </p>
            </div>
            <Button
              onClick={runAutomaticDeactivation}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Run Deactivation
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-1">
              <h3 className="font-medium text-blue-800">Check Status</h3>
              <p className="text-sm text-blue-600">
                Refresh the list of expiring and expired subscriptions.
              </p>
            </div>
            <Button
              onClick={checkExpiringAndExpired}
              disabled={loading}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {lastChecked && (
            <p className="text-sm text-slate-500 text-center">
              Last checked: {lastChecked.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Expiring Subscriptions */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Expiring Subscriptions (Next 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expiringCustomers.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800">No Expiring Subscriptions</h3>
              <p className="text-slate-600">All subscriptions are up to date!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expiringCustomers.map((customer) => (
                <div key={customer.customer_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="space-y-1">
                    <h4 className="font-medium text-slate-800">{customer.business_name}</h4>
                    <p className="text-sm text-slate-600">
                      Expires: {new Date(customer.subscription_end_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-500">{customer.phone}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(customer.days_remaining)}
                    <p className="text-sm text-slate-600 mt-1">
                      {customer.days_remaining} days remaining
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expired Subscriptions */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-red-600" />
            Expired Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expiredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800">No Expired Subscriptions</h3>
              <p className="text-slate-600">All subscriptions are current!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {expiredCustomers.length} subscription(s) have expired and need immediate attention.
                </AlertDescription>
              </Alert>
              
              {expiredCustomers.map((customer) => (
                <div key={customer.customer_id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="space-y-1">
                    <h4 className="font-medium text-red-800">{customer.business_name}</h4>
                    <p className="text-sm text-red-600">
                      Expired: {new Date(customer.subscription_end_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-red-500">{customer.phone}</p>
                  </div>
                  <div className="text-right">
                    {getDaysOverdueBadge(customer.days_overdue)}
                    <p className="text-sm text-red-600 mt-1">
                      Action required
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            How Automatic Deactivation Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <div className="space-y-2">
            <h4 className="font-medium text-slate-800">Daily Process:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>System checks all active subscriptions daily</li>
              <li>Identifies subscriptions that have expired (past end date)</li>
              <li>Automatically deactivates expired customers</li>
              <li>Blocks their websites with "Subscription expired" message</li>
              <li>Sends notifications to affected customers</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-slate-800">Manual Control:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use "Run Deactivation" to manually trigger the process</li>
              <li>Check "Expiring Subscriptions" for upcoming renewals</li>
              <li>Review "Expired Subscriptions" for overdue accounts</li>
              <li>Send payment reminders before automatic deactivation</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-slate-800">Reactivation:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Customers can reactivate by making payment</li>
              <li>Use the Paystack integration to send payment links</li>
              <li>Websites automatically unblock after successful payment</li>
              <li>Subscription dates are updated automatically</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
