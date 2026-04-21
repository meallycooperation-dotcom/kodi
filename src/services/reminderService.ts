import { supabase } from '../lib/supabaseClient';
import { buildCacheKey, readCache, writeCache } from '../lib/appCache';
import type { Reminder } from '../types/reminder';

export type NewReminderInput = Omit<Reminder, 'id' | 'createdAt'>;

const handleError = (error: Error | null) => {
  if (error) {
    console.error(error);
    throw error;
  }
};

type ReminderRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  send_date: string;
  status: string;
  created_at: string;
};

const mapReminderRow = (row: ReminderRow): Reminder => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  sendDate: row.send_date,
  status: (row.status as Reminder['status']) ?? 'pending',
  createdAt: row.created_at
});

const reminderCacheKey = (userId?: string) => buildCacheKey('reminders', userId ?? 'all');

export const getCachedReminders = async (userId?: string) => readCache<Reminder[]>(reminderCacheKey(userId), []);

export const fetchReminders = async (userId?: string) => {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('send_date', { ascending: false });

  handleError(error);
  const reminders = (data ?? []).map((row) => mapReminderRow(row as ReminderRow));
  await writeCache(reminderCacheKey(userId), reminders);
  return reminders;
};

export const insertReminder = async (payload: NewReminderInput) => {
  const { data, error } = await supabase
    .from('reminders')
    .insert([
      {
        user_id: payload.userId,
        title: payload.title,
        message: payload.message,
        send_date: payload.sendDate,
        status: payload.status ?? 'pending'
      }
    ])
    .select('*')
    .single();
  handleError(error);
  return mapReminderRow(data as ReminderRow);
};

export const updateReminder = async (id: string, status: Reminder['status']) => {
  const { data, error } = await supabase
    .from('reminders')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();
  handleError(error);
  return mapReminderRow(data as ReminderRow);
};

export const deleteReminder = async (id: string) => {
  const { error } = await supabase.from('reminders').delete().eq('id', id);
  handleError(error);
};
