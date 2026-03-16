import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, PauseCircle, PlayCircle, Search, FolderPlus, Video, Code } from 'lucide-react';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, categoriesRes] = await Promise.all([
        supabase.from('tasks').select('*, category:task_categories(*)').order('id', { ascending: false }),
        supabase.from('task_categories').select('*').order('name', { ascending: true })
      ]);
      
      if (tasksRes.error) throw tasksRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setTasks(tasksRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching tasks data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
    } else {
      setEditingTask({
        task_name: '',
        description: '',
        reward_amount: 0.1,
        instructions: '',
        status: 'active',
        category_id: categories.length > 0 ? categories[0].id : undefined,
        video_url: '',
        ad_code: ''
      });
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!editingTask?.task_name || !editingTask?.reward_amount) return;
    setIsSaving(true);
    try {
      if (editingTask.id) {
        // Update
        const { error } = await supabase.from('tasks').update({
          task_name: editingTask.task_name,
          description: editingTask.description,
          reward_amount: editingTask.reward_amount,
          instructions: editingTask.instructions,
          status: editingTask.status,
          category_id: editingTask.category_id,
          video_url: editingTask.video_url,
          ad_code: editingTask.ad_code
        }).eq('id', editingTask.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('tasks').insert([{
          task_name: editingTask.task_name,
          description: editingTask.description,
          reward_amount: editingTask.reward_amount,
          instructions: editingTask.instructions,
          status: editingTask.status || 'active',
          category_id: editingTask.category_id,
          video_url: editingTask.video_url,
          ad_code: editingTask.ad_code
        }]);
        if (error) throw error;
      }
      await fetchData();
      setIsTaskModalOpen(false);
      toast.success(editingTask.id ? 'Task updated successfully' : 'Task created successfully');
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);
    try {
      const { error } = await supabase.from('task_categories').insert([{ name: newCategoryName }]);
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

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  };

  const filteredTasks = tasks.filter(task => 
    task.task_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <CardHeader className="flex flex-row items-center justify-between">
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
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading tasks...</TableCell></TableRow>
              ) : filteredTasks.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">No tasks found</TableCell></TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{task.task_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px]">{task.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.category?.name || 'Uncategorized'}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                      ${(task.reward_amount || 0).toFixed(2)}
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
                        {task.ad_code && <Code className="w-4 h-4 text-amber-500" title="Has Ad Code" />}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Task Title</label>
              <Input placeholder="e.g., Watch YouTube Video" value={editingTask?.task_name || ''} onChange={e => setEditingTask({...editingTask, task_name: e.target.value})} />
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
              <Input type="number" step="0.01" placeholder="0.50" value={editingTask?.reward_amount || ''} onChange={e => setEditingTask({...editingTask, reward_amount: parseFloat(e.target.value)})} />
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

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Code className="w-4 h-4" /> Ad Code (Optional - e.g., Adstera)
              </label>
              <textarea 
                className="flex min-h-[80px] font-mono w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                placeholder="<!-- Ad Code Here -->"
                value={editingTask?.ad_code || ''}
                onChange={e => setEditingTask({...editingTask, ad_code: e.target.value})}
              />
              <p className="text-xs text-slate-500">HTML/JS code for ads. Will be injected if provided.</p>
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
                categories.map(c => (
                  <div key={c.id} className="p-3 text-sm flex justify-between items-center">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500" title="Delete Category (Not recommended if tasks exist)">
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
