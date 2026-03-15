export type User = {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  birthday?: string;
  country?: string;
  city?: string;
  zip_code?: string;
  profile_image?: string;
  balance: number;
  total_tasks_completed: number;
  total_withdraw: number;
  referral_earnings: number;
  role: 'user' | 'admin';
  status?: 'active' | 'banned';
  created_at: string;
};

export type TaskCategory = {
  id: string;
  name: string;
  created_at: string;
};

export type Task = {
  id: string;
  category_id?: string;
  task_name: string;
  description: string;
  reward_amount: number;
  status: 'active' | 'paused' | 'unavailable';
  created_at: string;
  instructions: string;
  video_url?: string;
  ad_code?: string;
  category?: TaskCategory;
};

export type TaskSubmission = {
  id: string;
  task_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  proof_url: string;
  amount: number;
  created_at: string;
  user?: User;
  task?: Task;
};

export type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  method: 'jazzcash' | 'easypaisa' | 'bank' | 'usd';
  account_details: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: User;
};

export type Notification = {
  id: string;
  user_id: string | null; // null means all users
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type AppSetting = {
  id: string;
  setting_key: string;
  setting_value: string;
  created_at: string;
};
