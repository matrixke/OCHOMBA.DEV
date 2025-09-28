import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Reply,
  Eye,
  X,
  Filter,
  Search,
  RefreshCw,
  Globe,
  User,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SupportMessage {
  id: string;
  domain: string;
  message: string;
  email?: string;
  user_agent?: string;
  page_url?: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  admin_notes?: string;
  admin_reply?: string;
  created_at: string;
  updated_at: string;
  replied_at?: string;
  closed_at?: string;
}

export function SupportMessages() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading support messages:', error);
      toast({
        title: "Error",
        description: "Failed to load support messages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshMessages = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ status: 'read' })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, status: 'read' } : msg
      ));

      toast({
        title: "Success",
        description: "Message marked as read.",
      });
    } catch (error) {
      console.error('Error updating message status:', error);
      toast({
        title: "Error",
        description: "Failed to update message status.",
        variant: "destructive",
      });
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ 
          status: 'replied',
          admin_reply: replyText.trim(),
          admin_notes: adminNotes.trim() || null
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      setMessages(messages.map(msg => 
        msg.id === selectedMessage.id 
          ? { ...msg, status: 'replied', admin_reply: replyText.trim(), admin_notes: adminNotes.trim() || null }
          : msg
      ));

      setShowReplyDialog(false);
      setReplyText('');
      setAdminNotes('');
      setSelectedMessage(null);

      toast({
        title: "Success",
        description: "Reply sent successfully!",
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply.",
        variant: "destructive",
      });
    }
  };

  const handleCloseMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ status: 'closed' })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, status: 'closed' } : msg
      ));

      toast({
        title: "Success",
        description: "Message closed.",
      });
    } catch (error) {
      console.error('Error closing message:', error);
      toast({
        title: "Error",
        description: "Failed to close message.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            New
          </Badge>
        );
      case 'read':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <Eye className="h-3 w-3 mr-1" />
            Read
          </Badge>
        );
      case 'replied':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <Reply className="h-3 w-3 mr-1" />
            Replied
          </Badge>
        );
      case 'closed':
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (message.email && message.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const newMessagesCount = messages.filter(m => m.status === 'new').length;

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
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            Support Messages
            {newMessagesCount > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200">
                {newMessagesCount} New
              </Badge>
            )}
          </h2>
          <p className="text-slate-600">Customer support messages from blocked websites</p>
        </div>
        <Button 
          onClick={refreshMessages}
          disabled={refreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by domain, message, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <Card className="text-center py-16 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">No messages found</h3>
              <p className="text-slate-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No support messages have been received yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card key={message.id} className="group bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-900">{message.domain}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(message.created_at).toLocaleDateString()}
                      </div>
                      {message.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {message.email}
                        </div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(message.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Message</Label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{message.message}</p>
                  </div>
                </div>

                {message.admin_reply && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Your Reply</Label>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 whitespace-pre-wrap">{message.admin_reply}</p>
                    </div>
                  </div>
                )}

                {message.admin_notes && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Admin Notes</Label>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-700 whitespace-pre-wrap">{message.admin_notes}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {message.status === 'new' && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsRead(message.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Mark as Read
                    </Button>
                  )}
                  
                  {message.status !== 'replied' && message.status !== 'closed' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedMessage(message);
                        setAdminNotes(message.admin_notes || '');
                        setShowReplyDialog(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                  
                  {message.status !== 'closed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCloseMessage(message.id)}
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Close
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5 text-green-600" />
              Reply to {selectedMessage?.domain}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reply">Reply Message</Label>
              <Textarea
                id="reply"
                placeholder="Type your reply to the customer..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes (Internal)</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes about this message..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReply} disabled={!replyText.trim()}>
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
