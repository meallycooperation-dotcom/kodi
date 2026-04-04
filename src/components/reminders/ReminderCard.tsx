import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Reminder } from '../../types/reminder';
import { deleteReminder, updateReminder } from '../../services/reminderService';

type ReminderCardProps = {
  reminder: Reminder;
  onStatusChange?: () => void;
  onDelete?: () => void;
  onDeleteOptimistic?: (id: string) => void;
  onDeleteRollback?: () => void;
};

const ReminderCard = ({ reminder, onStatusChange, onDelete, onDeleteOptimistic, onDeleteRollback }: ReminderCardProps) => {
  const [status, setStatus] = useState(reminder.status);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    setDeleting(true);
    onDeleteOptimistic?.(reminder.id);
    try {
      await deleteReminder(reminder.id);
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete reminder', error);
      onDeleteRollback?.();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="reminder-card">
      <div className="reminder-card__header">
        <h3>{reminder.title}</h3>
        <div className="reminder-card__actions">
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
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="reminder-card__delete"
            aria-label="Delete reminder"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <p>{reminder.message}</p>
      <small>{new Date(reminder.sendDate).toLocaleString()}</small>
    </article>
  );
};

export default ReminderCard;
