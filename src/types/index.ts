export type User = {
  id: string;
  auth_id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  phone_number?: string;
  date_of_birth?: string;
  birthday?: string;
  country?: string;
  city?: string;
  zip_code?: string;
  zipcode?: string;
  postal_code?: string;
  'profile-image'?: string;
  profile_image?: string;
  profile_image_url?: string;
  profile_pic?: string;
  avatar_url?: string;
  balance: number;
  referral_code?: string;
  referral_by?: string;
  gender?: string;
  occupation?: string;
  reason?: string;
  work_time?: string;
  source?: string;
  phone_country?: string;
  
  // Added columns for admin panel functionality
  total_tasks_completed?: number;
  total_withdraw?: number;
  referral_earnings?: number;
  role?: 'user' | 'admin';
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
  title: string;
  description: string;
  reward: number;
  status: 'active' | 'paused' | 'unavailable';
  created_at: string;
  instructions: string;
  video_url?: string;
  logo_url?: string;
  prroof_required?: boolean;
  max_submissions?: number;
  category?: TaskCategory;
};

export type TaskSubmission = {
  id: string;
  task_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  image_file?: string;
  video_file?: string;
  excel_file?: string;
  reward: number;
  submitted_at: string;
  admin_note?: string;
  created_at: string;
  user?: User;
  task?: Task;
};

export type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  walleet_address: string;
  account_details?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: User;
};

export type Notification = {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type AppSetting = {
  id: string;
  min_withdrawal?: number;
  max_task_reward?: number;
  announcements?: string;
  pkr_exchange_rate?: number;
  referral_commission?: number;
  updated_at: string;
};
