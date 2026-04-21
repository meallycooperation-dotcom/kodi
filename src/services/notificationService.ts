import { supabase } from '../lib/supabaseClient';
import { buildCacheKey, readCache, writeCache } from '../lib/appCache';
import type { Notification } from '../types/notification';

type NotificationRow = {
  id: string;
  creator_id: string;
  title: string;
  message: string;
  type: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
};

const mapNotificationRow = (row: NotificationRow): Notification => ({
  id: row.id,
  creatorId: row.creator_id,
  title: row.title,
  message: row.message,
  type: row.type as Notification['type'],
  relatedId: row.related_id,
  isRead: row.is_read,
  createdAt: row.created_at
});

const notificationCacheKey = (userId: string) => buildCacheKey('notifications', userId);

export const getCachedNotifications = async (userId: string): Promise<Notification[]> =>
  readCache<Notification[]>(notificationCacheKey(userId), []);

export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchNotifications', error);
    return [];
  }

  const notifications = (data as NotificationRow[]).map(mapNotificationRow);
  await writeCache(notificationCacheKey(userId), notifications);
  return notifications;
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('markAsRead', error);
    throw error;
  }
};

export const createNotification = async (payload: {
  creatorId: string;
  title: string;
  message: string;
  type: Notification['type'];
  relatedId?: string;
}): Promise<Notification> => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        creator_id: payload.creatorId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        related_id: payload.relatedId ?? null,
        is_read: false
      }
    ])
    .select('*')
    .single();

  if (error) {
    console.error('createNotification', error);
    throw error;
  }

  return mapNotificationRow(data as NotificationRow);
};
