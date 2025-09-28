import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  CreditCard, 
  Mail, 
  MessageCircle, 
  ExternalLink,
  Copy,
  CheckCircle,
  Send,
  Zap
} from 'lucide-react';
import { Customer } from '@/types/customer';
import { toast } from '@/hooks/use-toast';

interface PaystackIntegrationProps {
  customer: Customer;
  onClose: () => void;
}

export function PaystackIntegration({ customer, onClose }: PaystackIntegrationProps) {
  const [paystackConfig, setPaystackConfig] = useState({
    publicKey: 'pk_test_25e73e085ec6ffab263ed96cc63f580370f150eb',
    secretKey: 'sk_test_b0e7078927e040e796485ee13a80a505b9598166',
    businessEmail: 'payments@ochomba.dev',
  });
  
  const [paymentOptions, setPaymentOptions] = useState({
    monthsToPay: 1,
    totalAmount: 0,
    discountApplied: 0,
    finalAmount: 0
  });
  
  const [generatedLinks, setGeneratedLinks] = useState({
    paystackLink: '',
    whatsappMessage: '',
    emailSubject: '',
    emailBody: '',
  });

  const [loading, setLoading] = useState(false);

  // Initialize payment options on component mount
  React.useEffect(() => {
    updatePaymentOptions(1);
  }, []);

  // Calculate the amount to charge per month
  const getAmountPerMonth = () => {
    if (customer.useCustomPrice && customer.customPrice && customer.customPrice > 0) {
      return customer.customPrice;
    }
    // Use the price from the customer object (set in database)
    return customer.price || 0;
  };

  // Calculate total amount with discounts
  const calculateTotalAmount = (months: number) => {
    const monthlyAmount = getAmountPerMonth();
    const totalAmount = monthlyAmount * months;
    
    // Apply discount only for 1 year (12 months)
    let discount = 0;
    if (months === 12) {
      discount = totalAmount * 0.10; // 10% discount for 12 months only
    }
    
    const finalAmount = totalAmount - discount;
    
    return {
      totalAmount,
      discount,
      finalAmount
    };
  };

  // Update payment options when months change
  const updatePaymentOptions = (months: number) => {
    const calculation = calculateTotalAmount(months);
    setPaymentOptions({
      monthsToPay: months,
      totalAmount: calculation.totalAmount,
      discountApplied: calculation.discount,
      finalAmount: calculation.finalAmount
    });
  };

  const generatePaystackLink = async () => {
    setLoading(true);
    try {
      const amount = paymentOptions.finalAmount;
      // Paystack expects smallest currency unit. For USD this is cents.
      // Convert from KES to USD using rate 127.3
      const amountInUSD = amount / 127.3;
      const amountInMinor = Math.round(amountInUSD * 100);
      
      // Generate a unique reference
      const reference = `OCHOMBA_${customer.id}_${Date.now()}`;
      
      // Create Paystack payment link with months metadata
      // Force currency to USD and surface popular channels including mobile money (M-Pesa where available)
      const channels = encodeURIComponent('card,bank_transfer,mobile_money');
      const paystackLink = `https://paystack.com/pay/${reference}?amount=${amountInMinor}&currency=USD&email=${customer.email}&channels=${channels}&metadata[customer_id]=${customer.id}&metadata[business_name]=${encodeURIComponent(customer.businessName)}&metadata[months_paid]=${paymentOptions.monthsToPay}`;
      
      // Generate WhatsApp message
      const whatsappMessage = `Hello ${customer.businessName},

Your website subscription payment is due. Please complete your payment to avoid service interruption.

Payment Details:
- Amount: KES ${amount.toLocaleString()} ($${(amount / 127.3).toFixed(2)} USD)
- Plan: ${customer.subscriptionPlan}
- Duration: ${paymentOptions.monthsToPay} month(s)
- Reference: ${reference}
${paymentOptions.discountApplied > 0 ? `- Discount: $${paymentOptions.discountApplied.toLocaleString()}\n- You saved: $${paymentOptions.discountApplied.toLocaleString()}!` : ''}

Payment Methods:
- Card (USD)
- Bank Transfer
- M-Pesa / Mobile Money (where supported)

Pay now: ${paystackLink}

Thank you for choosing OCHOMBA.DEV!`;
      
      // Generate email content
      const emailSubject = `Payment Due - ${customer.businessName} Website Subscription (${paymentOptions.monthsToPay} month${paymentOptions.monthsToPay > 1 ? 's' : ''})`;
      const emailBody = `Dear ${customer.businessName},

Your website subscription payment is due. Please complete your payment to avoid service interruption.

Payment Details:
- Amount: KES ${amount.toLocaleString()} ($${(amount / 127.3).toFixed(2)} USD)
- Plan: ${customer.subscriptionPlan}
- Duration: ${paymentOptions.monthsToPay} month(s)
- Reference: ${reference}
- Due Date: ${new Date().toLocaleDateString()}
${paymentOptions.discountApplied > 0 ? `- Discount Applied: $${paymentOptions.discountApplied.toLocaleString()}\n- You Save: $${paymentOptions.discountApplied.toLocaleString()}!` : ''}

Payment Methods:
- Card (USD)
- Bank Transfer
- M-Pesa / Mobile Money (where supported)

To make payment, please click the link below:
${paystackLink}

If you have any questions, please don't hesitate to contact us.

Best regards,
OCHOMBA.DEV Team`;
      
      setGeneratedLinks({
        paystackLink,
        whatsappMessage,
        emailSubject,
        emailBody,
      });
      
      toast({
        title: "Payment Links Generated",
        description: "Paystack link and messages have been created successfully!",
      });
      
    } catch (error) {
      console.error('Error generating Paystack link:', error);
      toast({
        title: "Error",
        description: "Failed to generate payment links. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} has been copied to clipboard.`,
    });
  };

  const sendWhatsAppMessage = () => {
    const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(generatedLinks.whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendEmail = () => {
    // Copy email content to clipboard instead of opening mailto
    const emailContent = `To: ${customer.email}\nSubject: ${generatedLinks.emailSubject}\n\n${generatedLinks.emailBody}`;
    navigator.clipboard.writeText(emailContent);
    toast({
      title: "Email Content Copied",
      description: "Email content has been copied to clipboard. Paste it into your email client.",
    });
  };

  const amount = paymentOptions.finalAmount;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Paystack Payment Integration
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Business Name</Label>
                  <p className="text-sm text-slate-600">{customer.businessName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-slate-600">{customer.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-slate-600">{customer.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Plan</Label>
                  <p className="text-sm text-slate-600">{customer.subscriptionPlan}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Amount to Charge</Label>
                  <p className="text-lg font-bold text-green-600">KES {amount.toLocaleString()} (${(amount / 127.3).toFixed(2)} USD)</p>
                </div>
                {customer.useCustomPrice && customer.customPrice && (
                  <p className="text-xs text-slate-500">Custom pricing applied</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Payment Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monthsToPay" className="text-sm font-medium">
                  Number of Months to Pay
                </Label>
                <select
                  id="monthsToPay"
                  value={paymentOptions.monthsToPay}
                  onChange={(e) => updatePaymentOptions(parseInt(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 Month</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months (10% Discount)</option>
                </select>
              </div>

              {/* Payment Summary */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Monthly Rate:</span>
                  <span className="text-sm">KES {getAmountPerMonth().toLocaleString()} (${(getAmountPerMonth() / 127.3).toFixed(2)} USD)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Duration:</span>
                  <span className="text-sm">{paymentOptions.monthsToPay} month(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Subtotal:</span>
                  <span className="text-sm">KES {paymentOptions.totalAmount.toLocaleString()} (${(paymentOptions.totalAmount / 127.3).toFixed(2)} USD)</span>
                </div>
                {paymentOptions.discountApplied > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm font-medium">Discount:</span>
                    <span className="text-sm">-${paymentOptions.discountApplied.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-lg text-blue-600">KES {paymentOptions.finalAmount.toLocaleString()} (${(paymentOptions.finalAmount / 127.3).toFixed(2)} USD)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paystack Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Paystack Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publicKey">Public Key</Label>
                <Input
                  id="publicKey"
                  value={paystackConfig.publicKey}
                  onChange={(e) => setPaystackConfig({ ...paystackConfig, publicKey: e.target.value })}
                  placeholder="pk_test_..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretKey">Secret Key</Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={paystackConfig.secretKey}
                  onChange={(e) => setPaystackConfig({ ...paystackConfig, secretKey: e.target.value })}
                  placeholder="sk_test_..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={paystackConfig.businessEmail}
                  onChange={(e) => setPaystackConfig({ ...paystackConfig, businessEmail: e.target.value })}
                  placeholder="your-business@email.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Generate Payment Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generate Payment Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={generatePaystackLink}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Generating...' : 'Generate Paystack Link & Messages'}
              </Button>

              {generatedLinks.paystackLink && (
                <div className="space-y-4">
                  {/* Paystack Link */}
                  <div className="space-y-2">
                    <Label>Paystack Payment Link</Label>
                    <div className="flex gap-2">
                      <Input
                        value={generatedLinks.paystackLink}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(generatedLinks.paystackLink, 'Paystack link')}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => window.open(generatedLinks.paystackLink, '_blank')}
                        variant="outline"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={sendWhatsAppMessage}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send WhatsApp
                    </Button>
                    <Button
                      onClick={sendEmail}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Copy Email
                    </Button>
                  </div>

                  {/* Alternative Email Options */}
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600 text-center">Or use these email options:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => {
                          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${customer.email}&su=${encodeURIComponent(generatedLinks.emailSubject)}&body=${encodeURIComponent(generatedLinks.emailBody)}`;
                          window.open(gmailUrl, '_blank');
                        }}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Gmail
                      </Button>
                      <Button
                        onClick={() => {
                          const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${customer.email}&subject=${encodeURIComponent(generatedLinks.emailSubject)}&body=${encodeURIComponent(generatedLinks.emailBody)}`;
                          window.open(outlookUrl, '_blank');
                        }}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        Outlook
                      </Button>
                    </div>
                  </div>

                  {/* WhatsApp Message Preview */}
                  <div className="space-y-2">
                    <Label>WhatsApp Message Preview</Label>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <pre className="text-sm text-green-800 whitespace-pre-wrap">
                        {generatedLinks.whatsappMessage}
                      </pre>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(generatedLinks.whatsappMessage, 'WhatsApp message')}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy WhatsApp Message
                    </Button>
                  </div>

                  {/* Email Preview */}
                  <div className="space-y-2">
                    <Label>Email Preview</Label>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm">
                        <p className="font-medium text-blue-800">Subject: {generatedLinks.emailSubject}</p>
                        <div className="mt-2 text-blue-700 whitespace-pre-wrap">
                          {generatedLinks.emailBody}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(generatedLinks.emailBody, 'Email content')}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Email Content
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="space-y-2">
                <h4 className="font-medium text-slate-800">1. Paystack Setup:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Get your API keys from <a href="https://dashboard.paystack.com" target="_blank" className="text-blue-600 hover:underline">Paystack Dashboard</a></li>
                  <li>Update the Public Key and Secret Key above</li>
                  <li>Set your business email for payment notifications</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-slate-800">2. Payment Processing:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Generated links will redirect customers to Paystack</li>
                  <li>Payments will be processed securely by Paystack</li>
                  <li>You'll receive notifications when payments are completed</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-slate-800">3. Automatic Reactivation:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Set up webhooks to automatically unblock websites on successful payment</li>
                  <li>Configure Paystack webhook to call your API endpoint</li>
                  <li>Webhook URL: <code className="bg-slate-100 px-1 rounded">https://your-domain.com/api/paystack-webhook</code></li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
