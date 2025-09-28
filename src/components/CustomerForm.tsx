import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Building2, Globe, Mail, Phone, Calendar as CalendarIcon2, Target, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Customer } from '@/types/customer';
import { toast } from '@/hooks/use-toast';

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  editingCustomer?: Customer | null;
}

export function CustomerForm({ isOpen, onClose, onSave, editingCustomer }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    businessName: '',
    systemName: '',
    email: '',
    phone: '',
    websiteUrl: '',
    subscriptionPlan: 'Basic' as Customer['subscriptionPlan'], // Keep for database compatibility
    subscriptionStart: new Date(),
    isActive: true,
    isRegularClient: false,
    price: 0, // Monthly price in USD
  });

  useEffect(() => {
    if (editingCustomer) {
      setFormData({
        businessName: editingCustomer.businessName,
        systemName: editingCustomer.systemName,
        email: editingCustomer.email,
        phone: editingCustomer.phone,
        websiteUrl: editingCustomer.websiteUrl || '',
        subscriptionPlan: editingCustomer.subscriptionPlan,
        subscriptionStart: editingCustomer.subscriptionStart,
        isActive: editingCustomer.isActive,
        isRegularClient: editingCustomer.isRegularClient,
        price: editingCustomer.price || 0, // Use the price from customer
      });
    } else {
      setFormData({
        businessName: '',
        systemName: '',
        email: '',
        phone: '',
        websiteUrl: '',
        subscriptionPlan: 'Basic',
        subscriptionStart: new Date(),
        isActive: true,
        isRegularClient: false,
        price: 0,
      });
    }
  }, [editingCustomer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.businessName || !formData.systemName || !formData.email || !formData.phone || !formData.price || formData.price <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    onSave(formData);
    onClose();
    
    toast({
      title: editingCustomer ? "Customer Updated" : "Customer Added",
      description: `${formData.businessName} has been ${editingCustomer ? 'updated' : 'added'} successfully.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
          <p className="text-slate-600">
            {editingCustomer ? 'Update customer information and subscription details.' : 'Add a new customer to your subscription management system.'}
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-slate-800">Business Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="businessName" className="text-sm font-medium text-slate-700">
                  Business Name *
                </Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Enter business name"
                  className="border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="systemName" className="text-sm font-medium text-slate-700">
                  System/Website Name *
                </Label>
              <Input
                id="systemName"
                value={formData.systemName}
                onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                placeholder="Enter system name"
                  className="border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Mail className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-slate-800">Contact Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address *
                </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                  className="border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                  Phone Number *
                </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                  className="border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="websiteUrl" className="text-sm font-medium text-slate-700">
                Website URL
              </Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://example.com"
                  className="border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Subscription Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Target className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-slate-800">Subscription Details</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium text-slate-700">
                Monthly Price (USD) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="Enter monthly price in USD"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              <p className="text-xs text-slate-500">
                Monthly price: ${formData.price.toLocaleString()}/month
              </p>
            </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Subscription Start Date *
                </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                        "w-full justify-start text-left font-normal border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
                        !formData.subscriptionStart && "text-slate-400"
                  )}
                >
                      <CalendarIcon2 className="mr-2 h-4 w-4" />
                  {formData.subscriptionStart ? (
                    format(formData.subscriptionStart, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.subscriptionStart}
                  onSelect={(date) => date && setFormData({ ...formData, subscriptionStart: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
              </div>
          </div>

          {/* Status Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Zap className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-slate-800">Status</h3>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                  Active Subscription
                </Label>
                <p className="text-xs text-slate-500">Customer has an active subscription</p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <Label htmlFor="isActive" className="text-sm text-slate-700">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              {editingCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}