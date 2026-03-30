import { supabase } from '../lib/supabaseClient';
const handleError = (error) => {
    if (error) {
        console.error(error);
        throw error;
    }
};
const mapReminderRow = (row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    sendDate: row.send_date,
    status: row.status ?? 'pending',
    createdAt: row.created_at
});
export const fetchReminders = async (userId) => {
    if (!userId) {
        return [];
    }
    const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('send_date', { ascending: false });
    handleError(error);
    return (data ?? []).map((row) => mapReminderRow(row));
};
export const insertReminder = async (payload) => {
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
    return mapReminderRow(data);
};
export const updateReminder = async (id, status) => {
    const { data, error } = await supabase
        .from('reminders')
        .update({ status })
        .eq('id', id)
        .select('*')
        .single();
    handleError(error);
    return mapReminderRow(data);
};
