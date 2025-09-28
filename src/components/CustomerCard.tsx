import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Calendar, 
  Phone, 
  Mail, 
  Star, 
  Edit, 
  Power, 
  MessageCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { Customer, SUBSCRIPTION_PLANS } from '@/types/customer';

interface CustomerCardProps {
  customer: Customer;
  onToggleStatus: (id: string) => void;
  onEdit: (customer: Customer) => void;
  onSendPayment?: (customer: Customer) => void;
}

export function CustomerCard({ customer, onToggleStatus, onEdit, onSendPayment }: CustomerCardProps) {
  const getSubscriptionPrice = () => {
    if (customer.useCustomPrice && customer.customPrice && customer.customPrice > 0) {
      return customer.customPrice;
    }
    // Use the price from the customer object (set in database)
    return customer.price || 0;
  };

  const calculateDaysRemaining = () => {
    const now = new Date();
    const subscriptionEnd = new Date(customer.subscriptionStart);
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);
    const daysRemaining = Math.ceil((subscriptionEnd.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return daysRemaining;
  };

  const daysRemaining = calculateDaysRemaining();
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  const getStatusBadge = () => {
    if (!customer.isActive) {
      return (
        <Badge variant="outline" className="border-slate-300 text-slate-600 bg-slate-50">
          <Power className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      );
    }
    if (isExpired) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
    if (isExpiringSoon) {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
          <Clock className="h-3 w-3 mr-1" />
          Expiring Soon
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
        <TrendingUp className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  const sendWhatsAppReminder = () => {
    const price = getSubscriptionPrice();
    const message = `Hello ${customer.businessName}, this is a reminder from OCHOMBA.DEV. Your website subscription for ${customer.systemName} is expiring in ${daysRemaining} days. Kindly renew your ${customer.subscriptionPlan} plan ($${price.toLocaleString()}) to avoid interruption. Thank you for choosing OCHOMBA.DEV.`;
    const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'Basic':
      case 'Starter':
        return 'from-blue-500 to-blue-600';
      case 'Premium':
      case 'Standard':
        return 'from-purple-500 to-purple-600';
      case 'Enterprise':
      case 'Professional':
        return 'from-emerald-500 to-emerald-600';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <Card className="group bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden animate-fade-in-up">
      {/* Header with gradient accent */}
      <div className={`h-2 bg-gradient-to-r ${getPlanColor(customer.subscriptionPlan)}`} />
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                {customer.businessName}
              </h3>
              {customer.isRegularClient && (
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              )}
            </div>
            <p className="text-sm text-slate-600 font-medium">{customer.systemName}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            <Badge 
              variant="outline" 
              className={`border-0 text-white font-medium ${getPlanColor(customer.subscriptionPlan).replace('from-', 'bg-gradient-to-r ').replace('to-', ' ')}`}
            >
              {customer.subscriptionPlan}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Mail className="h-4 w-4 text-slate-500" />
            <span className="text-slate-700 font-medium truncate">{customer.email}</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Phone className="h-4 w-4 text-slate-500" />
            <span className="text-slate-700 font-medium">{customer.phone}</span>
          </div>
        </div>

        {/* Subscription Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-slate-700">Started: {customer.subscriptionStart.toLocaleDateString()}</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">${getSubscriptionPrice().toLocaleString()}</div>
              <div className="text-xs text-slate-500">
                {customer.useCustomPrice && customer.customPrice ? 'Custom Price' : 'Monthly'}
              </div>
            </div>
          </div>

          {/* Days Remaining */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isExpired ? 'bg-red-50 border border-red-200' : 
            isExpiringSoon ? 'bg-orange-50 border border-orange-200' : 
            'bg-green-50 border border-green-200'
          }`}>
            <span className={`text-sm font-medium ${
              isExpired ? 'text-red-700' : 
              isExpiringSoon ? 'text-orange-700' : 
              'text-green-700'
            }`}>
              {isExpired ? 'Subscription Expired' : `${daysRemaining} days remaining`}
            </span>
            <div className={`p-2 rounded-full ${
              isExpired ? 'bg-red-100' : 
              isExpiringSoon ? 'bg-orange-100' : 
              'bg-green-100'
            }`}>
              <Clock className={`h-4 w-4 ${
                isExpired ? 'text-red-600' : 
                isExpiringSoon ? 'text-orange-600' : 
                'text-green-600'
              }`} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(customer.id)}
            className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            <Power className="h-3 w-3 mr-1" />
            {customer.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(customer)}
            className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>

        {/* Payment and Communication Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {onSendPayment && (
            <Button
              size="sm"
              onClick={() => onSendPayment(customer)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CreditCard className="h-3 w-3 mr-1" />
              Send Payment
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={sendWhatsAppReminder}
            className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}