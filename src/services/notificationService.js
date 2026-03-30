import { supabase } from '../lib/supabaseClient';
const mapNotificationRow = (row) => ({
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    message: row.message,
    type: row.type,
    relatedId: row.related_id,
    isRead: row.is_read,
    createdAt: row.created_at
});
export const fetchNotifications = async (userId) => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });
    if (error) {
        console.error('fetchNotifications', error);
        return [];
    }
    return data.map(mapNotificationRow);
};
export const markAsRead = async (notificationId) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    if (error) {
        console.error('markAsRead', error);
        throw error;
    }
};
export const createNotification = async (payload) => {
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
    return mapNotificationRow(data);
};
