import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, DollarSign, Users, BarChart3, PieChart, Plus, Calendar as CalendarIcon2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Customer, Revenue, SUBSCRIPTION_PLANS } from '@/types/customer';
import { toast } from '@/hooks/use-toast';
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface AnalyticsProps {
  customers: Customer[];
  revenues: Revenue[];
  onAddRevenue: (revenue: Omit<Revenue, 'id'>) => void;
}

export function Analytics({ customers, revenues, onAddRevenue }: AnalyticsProps) {
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [revenueForm, setRevenueForm] = useState({
    amount: 0,
    date: new Date(),
    description: '',
  });

  // Early return if no data
  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Data Available</h3>
        <p className="text-slate-600">Add some customers to see analytics.</p>
      </div>
    );
  }

  // Calculate comprehensive analytics data
  const activeCustomers = customers.filter(c => c.isActive);
  const inactiveCustomers = customers.filter(c => !c.isActive);
  const blockedCustomers = customers.filter(c => c.isBlocked);
  const expiredCustomers = customers.filter(c => {
    const now = new Date();
    const subscriptionEnd = new Date(c.subscriptionStart);
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);
    return subscriptionEnd < now;
  });
  const regularCustomers = customers.filter(c => c.isRegularClient);
  const customPricingCustomers = customers.filter(c => c.useCustomPrice);

  // Calculate subscription revenue with custom pricing
  const totalSubscriptionRevenue = customers.reduce((total, customer) => {
    if (customer.isActive) {
      let price = 0;
      if (customer.useCustomPrice && customer.customPrice && customer.customPrice > 0) {
        price = customer.customPrice;
      } else {
        // Use the price from the customer object (set in database)
        price = customer.price || 0;
      }
      return total + price;
    }
    return total;
  }, 0);

  // Remove duplicate - already calculated above with custom pricing

  const totalOneTimeRevenue = revenues
    .filter(r => r.type === 'one-time')
    .reduce((total, revenue) => total + revenue.amount, 0);

  const totalRevenue = totalSubscriptionRevenue + totalOneTimeRevenue;

  // Additional comprehensive analytics
  const averageRevenuePerCustomer = customers.length > 0 ? totalRevenue / customers.length : 0;
  const conversionRate = customers.length > 0 ? (activeCustomers.length / customers.length) * 100 : 0;
  const churnRate = customers.length > 0 ? (inactiveCustomers.length / customers.length) * 100 : 0;
  const blockedRate = customers.length > 0 ? (blockedCustomers.length / customers.length) * 100 : 0;
  const customPricingRate = customers.length > 0 ? (customPricingCustomers.length / customers.length) * 100 : 0;

  // Calculate current month revenue
  const currentMonth = new Date();
  const currentMonthRevenue = revenues
    .filter(r => {
      const revenueDate = new Date(r.date);
      return revenueDate.getMonth() === currentMonth.getMonth() && 
             revenueDate.getFullYear() === currentMonth.getFullYear();
    })
    .reduce((total, r) => total + r.amount, 0);

  const currentMonthSubscriptionRevenue = customers
    .filter(c => c.isActive)
    .reduce((total, customer) => {
      const startDate = new Date(customer.subscriptionStart);
      const endDate = new Date(customer.subscriptionEndDate || startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      // Check if subscription is active this month
      if (startDate <= monthEnd && endDate >= monthStart) {
        // Use the price from the customer object (set in database)
        const price = customer.price || 0;
        return total + price;
      }
      return total;
    }, 0);

  const currentMonthTotal = currentMonthRevenue + currentMonthSubscriptionRevenue;

  // More accurate pie chart data - avoid double counting
  const pieChartData = [
    { name: 'Active', value: activeCustomers.length, color: '#10b981' },
    { name: 'Inactive', value: inactiveCustomers.length, color: '#6b7280' },
    { name: 'Blocked', value: blockedCustomers.length, color: '#ef4444' },
    { name: 'Regular', value: regularCustomers.length, color: '#f59e0b' }
  ].filter(item => item.value > 0); // Only show categories with data

  const monthlyData = [];
  const currentDate = new Date();
  for (let i = 5; i >= 0; i--) {
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
    
    // Get one-time revenue for this month
    const monthRevenue = revenues
      .filter(r => {
        const revenueDate = new Date(r.date);
        return revenueDate.getMonth() === month.getMonth() && 
               revenueDate.getFullYear() === month.getFullYear();
      })
      .reduce((total, r) => total + r.amount, 0);
    
    // Calculate subscription revenue for this month based on active subscriptions
    const subscriptionRevenue = customers
      .filter(c => c.isActive)
      .reduce((total, customer) => {
        const startDate = new Date(customer.subscriptionStart);
        const endDate = new Date(customer.subscriptionEndDate || startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        // Check if subscription was active during this month
        if (startDate <= monthEnd && endDate >= month) {
          let price = 0;
          if (customer.useCustomPrice && customer.customPrice && customer.customPrice > 0) {
            price = customer.customPrice;
          } else {
            // Use the price from the customer object (set in database)
            price = customer.price || 0;
          }
          
          return total + price;
        }
        return total;
      }, 0);

    monthlyData.push({
      month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenue: monthRevenue + subscriptionRevenue
    });
  }

  const handleAddRevenue = () => {
    if (!revenueForm.description || revenueForm.amount <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields with valid data.",
        variant: "destructive",
      });
      return;
    }

    onAddRevenue({
      clientId: '',
      amount: revenueForm.amount,
      type: 'one-time',
      description: revenueForm.description,
      date: revenueForm.date,
    });

    setRevenueForm({
      amount: 0,
      date: new Date(),
      description: '',
    });
    setShowRevenueForm(false);

    toast({
      title: "Success",
      description: "Revenue record added successfully!",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg">
          <BarChart3 className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
          Analytics Dashboard
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Comprehensive insights into your client base, revenue performance, and business growth metrics
        </p>
      </div>

      {/* Comprehensive Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">All time earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Subscription Revenue</CardTitle>
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">${totalSubscriptionRevenue.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Active subscriptions</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">One-time Revenue</CardTitle>
            <div className="p-3 bg-purple-100 rounded-xl">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">${totalOneTimeRevenue.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Additional services</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Current Month</CardTitle>
            <div className="p-3 bg-pink-100 rounded-xl">
              <CalendarIcon2 className="h-5 w-5 text-pink-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600">${currentMonthTotal.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">This month's total</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Conversion Rate</CardTitle>
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">Active vs Total</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Churn Rate</CardTitle>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{churnRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">Inactive customers</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Blocked Rate</CardTitle>
            <div className="p-3 bg-red-100 rounded-xl">
              <BarChart3 className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{blockedRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">Blocked customers</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Custom Pricing</CardTitle>
            <div className="p-3 bg-purple-100 rounded-xl">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{customPricingRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">Custom pricing rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Summary */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Data Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="font-semibold text-slate-800">Total Customers</div>
              <div className="text-2xl font-bold text-blue-600">{customers.length}</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="font-semibold text-slate-800">Revenue Records</div>
              <div className="text-2xl font-bold text-green-600">{revenues.length}</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="font-semibold text-slate-800">Chart Data Points</div>
              <div className="text-2xl font-bold text-purple-600">{monthlyData.length}</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="font-semibold text-slate-800">Custom Pricing</div>
              <div className="text-2xl font-bold text-orange-600">{customPricingCustomers.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Client Distribution Pie Chart */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-slate-800">
              <PieChart className="h-5 w-5 text-purple-600" />
              Client Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                  <Tooltip formatter={(value) => [value, 'Clients']} />
                </RechartsPieChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No data available for chart</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Revenue Trend */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-slate-800">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Monthly Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                <Tooltip 
                    formatter={(value) => [`$${value}`, 'Revenue']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No revenue data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Management */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-slate-800">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Revenue Management
          </CardTitle>
          <p className="text-slate-600 text-sm">
            Add one-time revenue entries and track additional income sources
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={() => setShowRevenueForm(true)}
            className="gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Add Revenue Entry
          </Button>
        </CardContent>
      </Card>

      {/* Revenue Form Dialog */}
      <Dialog open={showRevenueForm} onOpenChange={setShowRevenueForm}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <DialogHeader className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">Add Revenue Entry</DialogTitle>
            <p className="text-slate-600">Record additional revenue from services or one-time payments</p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                Amount (USD) *
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={revenueForm.amount}
                onChange={(e) => setRevenueForm({ ...revenueForm, amount: parseFloat(e.target.value) || 0 })}
                className="border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium text-slate-700">
                Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200",
                      !revenueForm.date && "text-slate-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {revenueForm.date ? (
                      format(revenueForm.date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={revenueForm.date}
                    onSelect={(date) => date && setRevenueForm({ ...revenueForm, date })}
                    initialFocus
                    className="rounded-lg border-0 shadow-xl"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                Description *
              </Label>
              <Input
                id="description"
                placeholder="Enter description"
                value={revenueForm.description}
                onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })}
                className="border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
              />
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowRevenueForm(false)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddRevenue}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Add Revenue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}