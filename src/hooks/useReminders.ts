import { useCallback, useEffect, useState } from 'react';
import type { Reminder } from '../types/reminder';
import { fetchReminders, getCachedReminders } from '../services/reminderService';
import useAuth from './useAuth';
import { useRealtimeRefresh } from './useRealtimeRefresh';

const useReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const loadReminders = useCallback(async () => {
    if (!user?.id) {
      setReminders([]);
      return;
    }

    try {
      const cached = await getCachedReminders(user.id);
      setReminders(cached);
    } catch (error) {
      console.error('useReminders cache error', error);
    }

    try {
      const data = await fetchReminders(user.id);
      setReminders(data);
    } catch (error) {
      console.error('useReminders error', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setReminders([]);
      return;
    }
    void loadReminders();
  }, [loadReminders, user?.id]);

  useRealtimeRefresh({
    enabled: Boolean(user?.id),
    channelName: `reminders:${user?.id ?? 'guest'}`,
    tables: [
      {
        table: 'reminders',
        filter: user?.id ? `user_id=eq.${user.id}` : undefined
      }
    ],
    onChange: loadReminders
  });

  return { reminders, refresh: loadReminders };
};

export default useReminders;
