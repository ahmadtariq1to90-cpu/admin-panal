import { useState, useEffect } from 'react';
import { Search, ShieldOff, ShieldCheck, Eye, Save, User as UserIcon, Activity, CreditCard, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { User, TaskSubmission, Withdrawal } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const getUserName = (user: Partial<User>) => user.name || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown User';
const getUserImage = (user: Partial<User>) => user['profile-image'] || user.profile_image || user.profile_image_url || user.profile_pic;
const getUserPhone = (user: Partial<User>) => user.phone || user.phone_number;
const getUserBirthday = (user: Partial<User>) => user.date_of_birth || user.birthday;

const getUserZipCode = (user: Partial<User>) => user.zip_code || user.zipcode;

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'tasks' | 'payouts'>('profile');
  
  // Edit State
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // History State
  const [taskHistory, setTaskHistory] = useState<TaskSubmission[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<Withdrawal[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pkrRate, setPkrRate] = useState(278);

  useEffect(() => {
    fetchUsers();
    fetchPkrRate();
  }, []);

  const fetchPkrRate = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').eq('setting_key', 'pkr_exchange_rate').limit(1).maybeSingle();
      if (data && data.setting_value) {
        setPkrRate(parseFloat(data.setting_value));
      }
    } catch (e) {
      console.error('Error fetching PKR rate', e);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').order('id', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) console.log('FIRST USER:', data[0]);
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserHistory = async (userId: string) => {
    setHistoryLoading(true);
    try {
      const [tasksRes, payoutsRes] = await Promise.all([
        supabase.from('task_submissions').select('*, task:tasks(*)').eq('user_id', userId).order('id', { ascending: false }),
        supabase.from('withdrawals').select('*').eq('user_id', userId).order('id', { ascending: false })
      ]);
      
      if (tasksRes.error) throw tasksRes.error;
      if (payoutsRes.error) throw payoutsRes.error;

      setTaskHistory(tasksRes.data || []);
      setPayoutHistory(payoutsRes.data || []);
    } catch (error: any) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load user history: ' + error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenUserModal = (user: User) => {
    setSelectedUser(user);
    setEditForm(user);
    setNewPassword('');
    setActiveTab('profile');
    setIsUserModalOpen(true);
    fetchUserHistory(user.id);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    const toastId = toast.loading('Saving user details...');
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editForm.name,
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          phone: editForm.phone,
          phone_number: editForm.phone_number,
          date_of_birth: editForm.date_of_birth,
          birthday: editForm.birthday,
          country: editForm.country,
          city: editForm.city,
          zip_code: editForm.zip_code,
          zipcode: editForm.zipcode,
          referral_code: editForm.referral_code,
          referral_by: editForm.referral_by,
          balance: editForm.balance,
          referral_earnings: editForm.referral_earnings,
          'profile-image': editForm['profile-image'],
          profile_image: editForm.profile_image,
          profile_image_url: editForm.profile_image_url,
          profile_pic: editForm.profile_pic,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      if (newPassword) {
        // Note: Updating auth password requires Supabase Admin API or the user doing it themselves.
        // This is a placeholder alert for the admin panel limitation without service_role key.
        toast.error('Password update requires Supabase Service Role key configuration in a secure backend environment.', { id: toastId });
        return;
      }

      // Refresh data
      await fetchUsers();
      setIsUserModalOpen(false);
      toast.success('User updated successfully!', { id: toastId });
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user: ' + error.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBan = async (user: User) => {
    if (user.role === 'admin') {
      toast.error('Cannot ban an admin user.');
      return;
    }

    const isBanned = user.status === 'banned';
    const newStatus = isBanned ? 'active' : 'banned';
    const actionText = isBanned ? 'unbanning' : 'banning';

    const toastId = toast.loading(`${isBanned ? 'Unbanning' : 'Banning'} user...`);
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', user.id);

      if (error) throw error;

      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      toast.success(`User successfully ${isBanned ? 'unbanned' : 'banned'}.`, { id: toastId });
    } catch (error: any) {
      console.error(`Error ${actionText} user:`, error);
      toast.error(`Failed to ${isBanned ? 'unban' : 'ban'} user: ` + error.message, { id: toastId });
    }
  };

  const filteredUsers = users.filter(user => 
    `${getUserName(user)}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {users.length > 0 && (
        <div className="bg-slate-100 p-4 rounded-md overflow-auto text-xs font-mono">
          {JSON.stringify(users[0], null, 2)}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">User Management</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>All Users</CardTitle>
          <div className="w-72 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name or email..." 
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
                <TableHead>Role</TableHead>
                <TableHead>Birthday</TableHead>
                <TableHead>Zip Code</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Total Withdrawn</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading users...</TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">No users found</TableCell></TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const userName = getUserName(user);
                  const userImage = getUserImage(user);
                  const userBirthday = getUserBirthday(user);
                  
                  return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {userImage ? (
                          <img src={userImage} alt={`${userName}`} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium text-xs">
                            {userName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{userName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                          {userImage && (
                            <a href={userImage} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline mt-0.5 block truncate max-w-[150px]">
                              View Image
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role || 'user'}
                        </Badge>
                        {user.status === 'banned' && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">Banned</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">{userBirthday ? new Date(userBirthday).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-slate-500">{getUserZipCode(user) || '-'}</TableCell>
                    <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                      ${(user.balance || 0).toFixed(2)}
                      <div className="text-[10px] text-slate-500 font-normal">Rs {((user.balance || 0) * pkrRate).toFixed(0)}</div>
                    </TableCell>
                    <TableCell>{user.total_tasks_completed || 0}</TableCell>
                    <TableCell>
                      ${(user.total_withdraw || 0).toFixed(2)}
                      <div className="text-[10px] text-slate-500 font-normal">Rs {((user.total_withdraw || 0) * pkrRate).toFixed(0)}</div>
                    </TableCell>
                    <TableCell className="text-slate-500">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" title="View & Edit Details" onClick={() => handleOpenUserModal(user)}>
                          <Eye className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title={user.role === 'admin' ? "Cannot ban admin" : user.status === 'banned' ? "Unban User" : "Ban User"} 
                          disabled={user.role === 'admin'}
                          onClick={() => handleToggleBan(user)}
                        >
                          {user.status === 'banned' ? (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <ShieldOff className="w-4 h-4 text-rose-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )})
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Modal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)}
        title={`User Details - ${selectedUser ? getUserName(selectedUser) : ''}`}
        className="max-w-4xl"
      >
        <div className="flex flex-col md:flex-row gap-6 h-[600px]">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-48 shrink-0 border-r border-slate-200 dark:border-slate-800 pr-4">
            <nav className="flex flex-col space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'profile' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <UserIcon className="w-4 h-4" /> Edit Profile
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'stats' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Activity className="w-4 h-4" /> Overview Stats
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'tasks' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <CheckSquare className="w-4 h-4" /> Task History
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'payouts' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Payout History
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto pr-2">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  {getUserImage(editForm) ? (
                    <img src={getUserImage(editForm)} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium text-xl">
                      {getUserName(editForm).charAt(0)}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Profile Image URL</label>
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="https://example.com/image.jpg" 
                        value={getUserImage(editForm) || ''} 
                        onChange={e => setEditForm({
                          ...editForm, 
                          'profile-image': e.target.value,
                          profile_image: e.target.value,
                          profile_image_url: e.target.value,
                          profile_pic: e.target.value
                        })} 
                        className="w-full max-w-sm"
                      />
                      {getUserImage(editForm) && (
                        <a href={getUserImage(editForm)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium shrink-0">
                          View Link
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Enter a valid image URL to update the profile picture.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                    <Input 
                      value={getUserName(editForm)} 
                      onChange={e => {
                        const val = e.target.value;
                        const parts = val.split(' ');
                        setEditForm({
                          ...editForm, 
                          name: val,
                          first_name: parts[0] || '',
                          last_name: parts.slice(1).join(' ') || ''
                        });
                      }} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <Input value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                    <Input 
                      value={getUserPhone(editForm) || ''} 
                      onChange={e => setEditForm({...editForm, phone: e.target.value, phone_number: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Birthday</label>
                    <Input 
                      type="date" 
                      value={getUserBirthday(editForm) || ''} 
                      onChange={e => setEditForm({...editForm, date_of_birth: e.target.value, birthday: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Country</label>
                    <Input value={editForm.country || ''} onChange={e => setEditForm({...editForm, country: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">City</label>
                    <Input value={editForm.city || ''} onChange={e => setEditForm({...editForm, city: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">ZIP Code</label>
                    <Input value={getUserZipCode(editForm) || ''} onChange={e => setEditForm({...editForm, zip_code: e.target.value, zipcode: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Referral Code</label>
                    <Input value={editForm.referral_code || ''} onChange={e => setEditForm({...editForm, referral_code: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Referred By</label>
                    <Input value={editForm.referral_by || ''} onChange={e => setEditForm({...editForm, referral_by: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Balance ($)</label>
                    <Input type="number" step="0.01" value={editForm.balance || 0} onChange={e => setEditForm({...editForm, balance: parseFloat(e.target.value)})} />
                    <p className="text-[10px] text-slate-500">Rs {((editForm.balance || 0) * pkrRate).toFixed(0)}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Referral Earnings ($)</label>
                    <Input type="number" step="0.01" value={editForm.referral_earnings || 0} onChange={e => setEditForm({...editForm, referral_earnings: parseFloat(e.target.value)})} />
                    <p className="text-[10px] text-slate-500">Rs {((editForm.referral_earnings || 0) * pkrRate).toFixed(0)}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">New Password (Leave blank to keep current)</label>
                    <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdateUser} disabled={isSaving} className="gap-2">
                    <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Balance</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Input type="number" step="0.01" value={editForm.balance || 0} onChange={e => setEditForm({...editForm, balance: parseFloat(e.target.value)})} className="w-32" />
                      <Button size="sm" onClick={handleUpdateUser} disabled={isSaving}>Update</Button>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Referral Earnings</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Input type="number" step="0.01" value={editForm.referral_earnings || 0} onChange={e => setEditForm({...editForm, referral_earnings: parseFloat(e.target.value)})} className="w-32" />
                      <Button size="sm" onClick={handleUpdateUser} disabled={isSaving}>Update</Button>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks Done</p>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{selectedUser?.total_tasks_completed || 0}</h4>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Withdrawn</p>
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${(selectedUser?.total_withdraw || 0).toFixed(2)}</h4>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Task History</h3>
                {historyLoading ? (
                  <p className="text-sm text-slate-500">Loading history...</p>
                ) : taskHistory.length === 0 ? (
                  <p className="text-sm text-slate-500">No tasks completed yet.</p>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reward</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taskHistory.map(th => (
                          <TableRow key={th.id}>
                            <TableCell className="font-medium">{th.task?.title || 'Unknown Task'}</TableCell>
                            <TableCell>
                              <Badge variant={th.status === 'approved' ? 'success' : th.status === 'rejected' ? 'destructive' : 'warning'}>
                                {th.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-emerald-600">${th.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-slate-500 text-sm">{new Date((th as any).created_at || (th as any).submitted_at || Date.now()).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payouts' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Payout History</h3>
                {historyLoading ? (
                  <p className="text-sm text-slate-500">Loading history...</p>
                ) : payoutHistory.length === 0 ? (
                  <p className="text-sm text-slate-500">No withdrawals requested yet.</p>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payoutHistory.map(ph => (
                          <TableRow key={ph.id}>
                            <TableCell className="font-bold text-emerald-600">${ph.amount.toFixed(2)}</TableCell>
                            <TableCell className="uppercase text-xs font-bold">{ph.method}</TableCell>
                            <TableCell>
                              <Badge variant={ph.status === 'approved' ? 'success' : ph.status === 'rejected' ? 'destructive' : 'warning'}>
                                {ph.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-500 text-sm">{new Date((ph as any).created_at || Date.now()).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
