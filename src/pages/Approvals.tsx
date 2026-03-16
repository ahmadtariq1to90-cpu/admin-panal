import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TaskSubmission } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function Approvals() {
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('task_submissions')
        .select(`
          *,
          user:users(*),
          task:tasks(*)
        `)
        .eq('status', 'pending')
        .order('id', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load pending submissions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => 
    `${sub.user?.first_name || ''} ${sub.user?.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.task?.task_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReview = (sub: TaskSubmission) => {
    setSelectedSubmission(sub);
    setIsReviewModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    setProcessing(true);
    const toastId = toast.loading('Approving submission...');
    try {
      // 1. Update submission status
      const { error: subError } = await supabase
        .from('task_submissions')
        .update({ status: 'approved' })
        .eq('id', selectedSubmission.id);
      if (subError) throw subError;

      // 2. Update user balance and tasks completed
      if (selectedSubmission.user) {
        const newBalance = (selectedSubmission.user.balance || 0) + selectedSubmission.amount;
        const newTasksCompleted = (selectedSubmission.user.total_tasks_completed || 0) + 1;
        
        const { error: userError } = await supabase
          .from('users')
          .update({ 
            balance: newBalance,
            total_tasks_completed: newTasksCompleted
          })
          .eq('id', selectedSubmission.user_id);
          
        if (userError) throw userError;
      }

      // 3. Create notification
      await supabase.from('notifications').insert({
        user_id: selectedSubmission.user_id,
        title: 'Task Approved',
        message: `Your submission for "${selectedSubmission.task?.task_name}" was approved. You earned $${selectedSubmission.amount.toFixed(2)}!`,
        is_read: false
      });

      setSubmissions(submissions.filter(s => s.id !== selectedSubmission.id));
      setIsReviewModalOpen(false);
      toast.success('Submission approved successfully!', { id: toastId });
    } catch (error: any) {
      console.error('Error approving submission:', error);
      toast.error('Failed to approve submission: ' + error.message, { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    setProcessing(true);
    const toastId = toast.loading('Rejecting submission...');
    try {
      const { error } = await supabase
        .from('task_submissions')
        .update({ status: 'rejected' })
        .eq('id', selectedSubmission.id);
      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: selectedSubmission.user_id,
        title: 'Task Rejected',
        message: `Your submission for "${selectedSubmission.task?.task_name}" was rejected. ${rejectReason ? `Reason: ${rejectReason}` : ''}`,
        is_read: false
      });

      setSubmissions(submissions.filter(s => s.id !== selectedSubmission.id));
      setIsReviewModalOpen(false);
      setRejectReason('');
      toast.success('Submission rejected.', { id: toastId });
    } catch (error: any) {
      console.error('Error rejecting submission:', error);
      toast.error('Failed to reject submission: ' + error.message, { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Task Approvals</h1>
        <Badge variant="warning" className="text-sm px-3 py-1">
          {submissions.length} Pending
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Submissions</CardTitle>
          <div className="w-72 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search user or task..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">Loading submissions...</TableCell>
                </TableRow>
              ) : filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">No pending submissions found.</TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{sub.user?.first_name} {sub.user?.last_name}</p>
                        <p className="text-xs text-slate-500">{sub.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{sub.task?.task_name}</p>
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                      ${sub.amount?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date((sub as any).created_at || (sub as any).submitted_at || Date.now()).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {sub.proof_url?.startsWith('http') ? (
                        <a href={sub.proof_url} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium">
                          View Image <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[150px] block" title={sub.proof_url}>
                          {sub.proof_url || 'No proof provided'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleReview(sub)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal 
        isOpen={isReviewModalOpen} 
        onClose={() => !processing && setIsReviewModalOpen(false)}
        title="Review Task Submission"
        className="max-w-2xl"
      >
        {selectedSubmission && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">User</p>
                <p className="font-medium text-slate-900 dark:text-white">{selectedSubmission.user?.first_name} {selectedSubmission.user?.last_name}</p>
                <p className="text-sm text-slate-500">{selectedSubmission.user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Task</p>
                <p className="font-medium text-slate-900 dark:text-white">{selectedSubmission.task?.task_name}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Reward: ${(selectedSubmission.amount || 0).toFixed(2)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">Proof Submitted</p>
              {selectedSubmission.proof_url?.startsWith('http') ? (
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={selectedSubmission.proof_url} alt="Proof" className="w-full h-auto max-h-[300px] object-contain bg-slate-100 dark:bg-slate-900" />
                </div>
              ) : (
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-mono text-sm">
                  {selectedSubmission.proof_url || 'No proof provided'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rejection Reason (Optional)</label>
              <Input 
                placeholder="If rejecting, explain why..." 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                disabled={processing}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" onClick={() => setIsReviewModalOpen(false)} disabled={processing}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing} className="gap-2">
                <XCircle className="w-4 h-4" /> {processing ? 'Processing...' : 'Reject'}
              </Button>
              <Button variant="success" onClick={handleApprove} disabled={processing} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                <CheckCircle className="w-4 h-4" /> {processing ? 'Processing...' : 'Approve & Pay'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
