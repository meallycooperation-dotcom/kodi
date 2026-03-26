import { useState } from 'react';
import Badge from '../ui/Badge';
import type { Reminder } from '../../types/reminder';
import { updateReminder } from '../../services/reminderService';

type ReminderCardProps = {
  reminder: Reminder;
  onStatusChange?: () => void;
};

const ReminderCard = ({ reminder, onStatusChange }: ReminderCardProps) => {
  const [status, setStatus] = useState(reminder.status);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await updateReminder(reminder.id, newStatus as Reminder['status']);
      setStatus(newStatus as Reminder['status']);
      onStatusChange?.();
    } catch (error) {
      console.error('Failed to update reminder status', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <article className="reminder-card">
      <div className="reminder-card__header">
        <h3>{reminder.title}</h3>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={updating}
          className="px-3 py-1 border rounded-lg text-sm"
        >
          <option value="pending">Pending</option>
          <option value="sent">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <p>{reminder.message}</p>
      <small>{new Date(reminder.sendDate).toLocaleString()}</small>
    </article>
  );
};

export default ReminderCard;
