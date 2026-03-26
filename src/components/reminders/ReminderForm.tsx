import { FormEvent, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { insertReminder } from '../../services/reminderService';
import useAuth from '../../hooks/useAuth';
import useReminders from '../../hooks/useReminders';

const ReminderForm = () => {
  const { user } = useAuth();
  const { refresh } = useReminders();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    message: '',
    sendDate: '',
    reminderStatus: 'pending'
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setStatus('Sign in to create reminders.');
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await insertReminder({
        userId: user.id,
        title: form.title,
        message: form.message,
        sendDate: form.sendDate,
        status: form.reminderStatus as 'pending' | 'sent' | 'cancelled'
      });

      setStatus('Reminder created successfully.');
      setForm({
        title: '',
        message: '',
        sendDate: '',
        reminderStatus: 'pending'
      });
      await refresh(); // Refresh the reminders list
    } catch (error) {
      console.error(error);
      setStatus('Failed to create reminder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="reminder-form space-y-4" onSubmit={handleSubmit}>
      <Input
        label="Title"
        name="title"
        value={form.title}
        onChange={(event) => handleChange('title', event.target.value)}
        placeholder="e.g. Payment follow-up"
        required
      />

      <label className="input-field">
        <span>Message</span>
        <textarea
          value={form.message}
          onChange={(event) => handleChange('message', event.target.value)}
          className="w-full p-3 border rounded-lg"
          placeholder="Enter reminder message"
          rows={4}
          required
        />
      </label>

      <Input
        label="Send Date"
        name="sendDate"
        type="datetime-local"
        value={form.sendDate}
        onChange={(event) => handleChange('sendDate', event.target.value)}
        required
      />

      <label className="input-field">
        <span>Status</span>
        <select
          value={form.reminderStatus}
          onChange={(event) => handleChange('reminderStatus', event.target.value)}
          className="w-full p-3 border rounded-lg"
        >
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>

      <Button type="submit" disabled={loading}>
        {loading ? 'Creating…' : 'Create Reminder'}
      </Button>
      {status && <p>{status}</p>}
    </form>
  );
};

export default ReminderForm;