// Shared row shapes matching supabase/schema.sql

export type Profile = {
  id: string;
  display_name: string;
  friend_code: string;
  daily_goal: number;
  reviews_today: number;
  reviews_date: string | null;
  current_streak: number;
  last_goal_date: string | null;
};

export type Deck = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
};

export type Card = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  interval_minutes: number;
  next_review_at: string;
};
