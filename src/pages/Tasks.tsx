import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, PauseCircle, PlayCircle, Search, FolderPlus, Video, Code } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Task, TaskCategory } from '@/types';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [pkrRate, setPkrRate] = useState(280);

  useEffect(() => {
    fetchData();
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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Try to fetch categories first
      const categoriesRes = await supabase.from('task_categories').select('*').order('name', { ascending: true });
      
      let categoriesData = [];
      if (!categoriesRes.error) {
        categoriesData = categoriesRes.data || [];
        setCategories(categoriesData);
      } else {
        console.warn('task_categories table might be missing:', categoriesRes.error);
      }

      // Try to fetch tasks with category join
      let tasksRes = await supabase.from('tasks').select('*, category:task_categories(*)').order('id', { ascending: false });
      
      // If join fails (likely due to missing category_id column or table), fetch without join
      if (tasksRes.error) {
        console.warn('Failed to fetch tasks with categories, falling back to simple fetch:', tasksRes.error);
        tasksRes = await supabase.from('tasks').select('*').order('id', { ascending: false });
        
        if (tasksRes.error) {
          tasksRes = await supabase.from('tasks table').select('*').order('id', { ascending: false });
        }
      }
      
      if (tasksRes.error) throw tasksRes.error;

      // Map data to handle both schemas
      const mappedTasks = (tasksRes.data || []).map((t: any) => ({
        ...t,
        reward: t.reward !== undefined ? t.reward : (t.reward_amount || 0),
        video_url: t.video_url !== undefined ? t.video_url : (t.task_link || ''),
        logo_url: t.logo_url || t.logo || '',
        prroof_required: t.prroof_required !== undefined ? t.prroof_required : (t.ad_code === 'true'),
        status: t.status || 'active'
      }));

      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error fetching tasks data:', error);
      toast.error('Failed to load tasks. Please check database schema.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
    } else {
      setEditingTask({
        title: '',
        description: '',
        reward: 0.1,
        instructions: '',
        status: 'active',
        category_id: categories.length > 0 ? categories[0].id : undefined,
        video_url: '',
        logo_url: '',
        prroof_required: true
      });
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!editingTask?.title || !editingTask?.reward) return;
    setIsSaving(true);
    try {
      if (editingTask.id) {
        // Update
        let updateData: any = {
          title: editingTask.title,
          description: editingTask.description,
          instructions: editingTask.instructions,
          category_id: editingTask.category_id || null,
          logo_url: editingTask.logo_url,
        };

        try {
          const { error } = await supabase.from('tasks').update({
            ...updateData,
            reward: editingTask.reward,
            status: editingTask.status,
            video_url: editingTask.video_url,
          }).eq('id', editingTask.id);
          
          if (error) {
            const { error: error2 } = await supabase.from('tasks table').update({
              ...updateData,
              reward: editingTask.reward,
              status: editingTask.status,
              video_url: editingTask.video_url,
            }).eq('id', editingTask.id);
            
            if (error2) {
              const { error: error3 } = await supabase.from('tasks').update({
                ...updateData,
                reward_amount: editingTask.reward,
                task_link: editingTask.video_url,
                ad_code: 'false',
              }).eq('id', editingTask.id);
              if (error3) throw error3;
            }
          }
        } catch (e) {
          console.error('Update error details:', e);
          throw e;
        }
      } else {
        // Insert
        const id = uuidv4();
        let insertData: any = {
          id,
          title: editingTask.title,
          description: editingTask.description,
          instructions: editingTask.instructions,
          category_id: editingTask.category_id || null,
          logo_url: editingTask.logo_url,
        };

        // Try to determine which schema to use
        try {
          // Try schema 1 (tasks table)
          const { error } = await supabase.from('tasks').insert([{
            ...insertData,
            reward: editingTask.reward,
            status: editingTask.status || 'active',
            video_url: editingTask.video_url,
          }]);
          
          if (error) {
            // If it fails, try schema 2 (tasks table)
            const { error: error2 } = await supabase.from('tasks table').insert([{
              ...insertData,
              reward: editingTask.reward,
              status: editingTask.status || 'active',
              video_url: editingTask.video_url,
            }]);
            
            if (error2) {
              const { error: error3 } = await supabase.from('tasks').insert([{
                ...insertData,
                reward_amount: editingTask.reward,
                task_link: editingTask.video_url,
                ad_code: 'false',
                category: 'General',
              }]);
              if (error3) throw error3;
            }
          }
        } catch (e) {
          console.error('Insert error details:', e);
          throw e;
        }
      }
      await fetchData();
      setIsTaskModalOpen(false);
      toast.success(editingTask.id ? 'Task updated successfully' : 'Task created successfully');
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task: ' + (error.message || JSON.stringify(error)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);
    try {
      const { error } = await supabase.from('task_categories').insert([{ id: uuidv4(), name: newCategoryName }]);
      if (error) throw error;
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
      await fetchData();
      toast.success('Category created successfully');
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category: ' + error.message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? Tasks in this category might lose their categorization.')) return;
    
    try {
      const { error } = await supabase.from('task_categories').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      toast.success('Category deleted successfully');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category: ' + error.message);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
      if (error) {
        const { error: error2 } = await supabase.from('tasks table').update({ status: newStatus }).eq('id', task.id);
        if (error2) throw error2;
      }
      await fetchData();
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  };

  const filteredTasks = tasks.filter(task => 
    task.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Task Management</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsCategoryModalOpen(true)} className="gap-2">
            <FolderPlus className="w-4 h-4" />
            Categories
          </Button>
          <Button onClick={() => handleOpenTaskModal()} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Task
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>All Tasks</CardTitle>
          <div className="w-72 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search tasks..." 
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
                <TableHead>Logo</TableHead>
                <TableHead>Task Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Features</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading tasks...</TableCell></TableRow>
              ) : filteredTasks.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">No tasks found</TableCell></TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      {task.logo_url ? (
                        <img src={task.logo_url} alt="" className="w-8 h-8 rounded-md object-cover border border-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">No Logo</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{task.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px]">{task.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.category?.name || 'Uncategorized'}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                      ${(task.reward || 0).toFixed(2)}
                      <div className="text-[10px] text-slate-500 font-normal">Rs {((task.reward || 0) * pkrRate).toFixed(0)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        task.status === 'active' ? 'success' : 
                        task.status === 'paused' ? 'warning' : 'destructive'
                      }>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {task.video_url && <Video className="w-4 h-4 text-indigo-500" title="Has Video" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" title={task.status === 'active' ? 'Pause' : 'Activate'} onClick={() => toggleTaskStatus(task)}>
                          {task.status === 'active' ? (
                            <PauseCircle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <PlayCircle className="w-4 h-4 text-emerald-500" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => handleOpenTaskModal(task)}>
                          <Edit className="w-4 h-4 text-slate-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Task Modal */}
      <Modal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)}
        title={editingTask?.id ? "Edit Task" : "Create New Task"}
        className="max-w-2xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Task Title</label>
              <Input placeholder="e.g., Watch YouTube Video" value={editingTask?.title || ''} onChange={e => setEditingTask({...editingTask, title: e.target.value})} />
            </div>
            
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Task Logo URL</label>
              <Input placeholder="https://example.com/logo.png" value={editingTask?.logo_url || ''} onChange={e => setEditingTask({...editingTask, logo_url: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                value={editingTask?.category_id || ''}
                onChange={e => setEditingTask({...editingTask, category_id: e.target.value})}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                value={editingTask?.status || 'active'}
                onChange={e => setEditingTask({...editingTask, status: e.target.value as any})}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="unavailable">Not Available</option>
              </select>
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <Input placeholder="Brief description of the task" value={editingTask?.description || ''} onChange={e => setEditingTask({...editingTask, description: e.target.value})} />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reward Amount ($)</label>
              <Input type="number" step="0.01" placeholder="0.50" value={editingTask?.reward || ''} onChange={e => setEditingTask({...editingTask, reward: parseFloat(e.target.value)})} />
              <p className="text-[10px] text-slate-500">Rs {((editingTask?.reward || 0) * pkrRate).toFixed(0)}</p>
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Detailed Instructions</label>
              <textarea 
                className="flex min-h-[100px] w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                placeholder="Step 1...&#10;Step 2..."
                value={editingTask?.instructions || ''}
                onChange={e => setEditingTask({...editingTask, instructions: e.target.value})}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Video className="w-4 h-4" /> Video URL (Optional)
              </label>
              <Input placeholder="https://youtube.com/..." value={editingTask?.video_url || ''} onChange={e => setEditingTask({...editingTask, video_url: e.target.value})} />
              <p className="text-xs text-slate-500">If left blank, the video option will not show in the app.</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
            <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
            <Button variant="default" onClick={handleSaveTask} disabled={isSaving}>
              {isSaving ? 'Saving...' : (editingTask?.id ? 'Save Changes' : 'Create Task')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)}
        title="Manage Categories"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Add New Category</label>
            <div className="flex gap-2">
              <Input placeholder="e.g., Social Media" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
              <Button onClick={handleSaveCategory} disabled={isSavingCategory || !newCategoryName.trim()}>Add</Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Existing Categories</label>
            <div className="border border-slate-200 dark:border-slate-800 rounded-md divide-y divide-slate-200 dark:divide-slate-800 max-h-60 overflow-y-auto">
              {categories.length === 0 ? (
                <div className="p-3 text-sm text-slate-500 text-center">No categories found</div>
              ) : (
                categories.map((c, index) => (
                  <div key={c.id} className="p-3 text-sm flex justify-between items-center">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      <span className="text-slate-500 mr-2">#{index + 1}</span>
                      {c.name}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-rose-500" 
                      title="Delete Category (Not recommended if tasks exist)"
                      onClick={() => handleDeleteCategory(c.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
