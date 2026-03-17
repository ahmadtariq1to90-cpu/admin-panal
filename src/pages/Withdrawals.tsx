import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, DollarSign, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Withdrawal } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          user:users(*)
        `)
        .eq('status', 'pending')
        .order('id', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error: any) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load pending withdrawals: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => 
    `${w.user?.first_name || ''} ${w.user?.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReview = (w: Withdrawal) => {
    setSelectedWithdrawal(w);
    setIsReviewModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;
    setProcessing(true);
    const toastId = toast.loading('Processing withdrawal...');
    try {
      // 1. Update withdrawal status
      const { error: wError } = await supabase
        .from('withdrawals')
        .update({ status: 'approved' })
        .eq('id', selectedWithdrawal.id);
      if (wError) throw wError;

      // 2. Update user total_withdraw
      if (selectedWithdrawal.user) {
        const newTotalWithdraw = (selectedWithdrawal.user.total_withdraw || 0) + selectedWithdrawal.amount;
        
        const { error: userError } = await supabase
          .from('users')
          .update({ total_withdraw: newTotalWithdraw })
          .eq('id', selectedWithdrawal.user_id);
          
        if (userError) throw userError;
      }

      // 3. Create notification
      await supabase.from('notifications').insert({
        user_id: selectedWithdrawal.user_id,
        title: 'Withdrawal Approved',
        message: `Your withdrawal request for $${selectedWithdrawal.amount.toFixed(2)} via ${selectedWithdrawal.method} has been processed and paid.`,
        is_read: false
      });

      setWithdrawals(withdrawals.filter(w => w.id !== selectedWithdrawal.id));
      setIsReviewModalOpen(false);
      toast.success('Withdrawal marked as paid!', { id: toastId });
    } catch (error: any) {
      console.error('Error approving withdrawal:', error);
      toast.error('Failed to approve withdrawal: ' + error.message, { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) return;
    setProcessing(true);
    const toastId = toast.loading('Rejecting withdrawal and refunding...');
    try {
      // 1. Update withdrawal status
      const { error: wError } = await supabase
        .from('withdrawals')
        .update({ status: 'rejected' })
        .eq('id', selectedWithdrawal.id);
      if (wError) throw wError;

      // 2. Refund balance to user
      if (selectedWithdrawal.user) {
        const newBalance = (selectedWithdrawal.user.balance || 0) + selectedWithdrawal.amount;
        
        const { error: userError } = await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', selectedWithdrawal.user_id);
          
        if (userError) throw userError;
      }

      // 3. Create notification
      await supabase.from('notifications').insert({
        user_id: selectedWithdrawal.user_id,
        title: 'Withdrawal Rejected',
        message: `Your withdrawal request for $${selectedWithdrawal.amount.toFixed(2)} was rejected. The amount has been refunded to your balance. ${rejectReason ? `Reason: ${rejectReason}` : ''}`,
        is_read: false
      });

      setWithdrawals(withdrawals.filter(w => w.id !== selectedWithdrawal.id));
      setIsReviewModalOpen(false);
      setRejectReason('');
      toast.success('Withdrawal rejected and refunded.', { id: toastId });
    } catch (error: any) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('Failed to reject withdrawal: ' + error.message, { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Withdrawal Requests</h1>
        <Badge variant="warning" className="text-sm px-3 py-1">
          {withdrawals.length} Pending
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Pending Payouts</CardTitle>
          <div className="w-72 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search user or method..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Account Details</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">Loading withdrawals...</TableCell>
                </TableRow>
              ) : filteredWithdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">No pending withdrawals found.</TableCell>
                </TableRow>
              ) : (
                filteredWithdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{w.user?.first_name} {w.user?.last_name}</p>
                        <p className="text-xs text-slate-500">{w.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                      ${w.amount?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase font-bold tracking-wider text-xs">
                        {w.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {w.account_details}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date((w as any).created_at || Date.now()).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleReview(w)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Modal 
        isOpen={isReviewModalOpen} 
        onClose={() => !processing && setIsReviewModalOpen(false)}
        title="Review Withdrawal Request"
        className="max-w-lg"
      >
        {selectedWithdrawal && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2">
                <DollarSign className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                ${(selectedWithdrawal.amount || 0).toFixed(2)}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-widest font-medium">
                Requested Amount
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">User</span>
                <span className="font-medium text-slate-900 dark:text-white">{selectedWithdrawal.user?.first_name} {selectedWithdrawal.user?.last_name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Payment Method</span>
                <Badge variant="outline" className="uppercase">{selectedWithdrawal.method}</Badge>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Account Details</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{selectedWithdrawal.account_details}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Current Balance</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">${(selectedWithdrawal.user?.balance || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rejection Reason (Optional)</label>
              <Input 
                placeholder="If rejecting, explain why (funds will be refunded)..." 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={processing}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" onClick={() => setIsReviewModalOpen(false)} disabled={processing}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing} className="gap-2">
                <XCircle className="w-4 h-4" /> {processing ? 'Processing...' : 'Reject & Refund'}
              </Button>
              <Button variant="success" onClick={handleApprove} disabled={processing} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                <CheckCircle className="w-4 h-4" /> {processing ? 'Processing...' : 'Mark as Paid'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
