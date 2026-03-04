export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  ff_uid?: string;
  ff_name?: string;
  avatar?: string;
  bkash_number?: string;
  nagad_number?: string;
  district?: string;
  balance: number;
  referral_code: string;
  referred_by?: string;
  is_admin: number;
  is_banned: number;
  total_kills?: number;
  created_at: string;
}

export interface Tournament {
  id: string;
  title: string;
  banner: string;
  entry_fee: number;
  prize_pool: number;
  match_type: 'Solo' | 'Duo' | 'Squad';
  map_type: 'Bermuda' | 'Purgatory' | 'Kalahari';
  start_time: string;
  slots: number;
  slots_filled: number;
  status: 'upcoming' | 'live' | 'completed';
  room_id?: string;
  room_password?: string;
  prize_1st?: number;
  prize_2nd?: number;
  prize_3rd?: number;
  is_free?: boolean;
  ads_required?: number;
  per_kill?: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'deposit' | 'withdraw' | 'entry_fee' | 'prize';
  method?: 'bkash' | 'nagad' | 'rocket';
  transaction_id?: string;
  screenshot?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: any;
  phone?: string;
  name?: string;
  user_name?: string;
  user_phone?: string;
  ff_uid?: string;
  ff_name?: string;
}

export interface TournamentResult {
  id: string;
  tournament_id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  ff_name?: string;
  ff_uid?: string;
  screenshot: string;
  kills?: number;
  is_winner?: boolean;
  position?: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: any;
}

export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  created_at: any;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  image?: string;
  button_text?: string;
  button_link?: string;
  updated_at: any;
}

export interface LeaderboardPrizes {
  prize_1st: number;
  prize_2nd: number;
  prize_3rd: number;
  updated_at: any;
}
