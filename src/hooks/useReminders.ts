import { useEffect, useState } from 'react';
import type { Reminder } from '../types/reminder';
import { fetchReminders } from '../services/reminderService';
import useAuth from './useAuth';

const useReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const loadReminders = async () => {
    try {
      const data = await fetchReminders(user?.id);
      setReminders(data);
    } catch (error) {
      console.error('useReminders error', error);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setReminders([]);
      return;
    }
    loadReminders();
  }, [user?.id]);

  return { reminders, refresh: loadReminders };
};

export default useReminders;
