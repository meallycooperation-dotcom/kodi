import { useState } from 'react';
import ReminderCard from '../../components/reminders/ReminderCard';
import ReminderForm from '../../components/reminders/ReminderForm';
import Button from '../../components/ui/Button';
import useReminders from '../../hooks/useReminders';

const Reminders = () => {
  const { reminders, refresh } = useReminders();
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Reminders</h1>
        <Button type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Hide Form' : 'Create Reminder'}
        </Button>
      </div>

      {showForm && <ReminderForm />}

      <div className="space-y-4">
        {reminders.map((reminder) => (
          <ReminderCard key={reminder.id} reminder={reminder} onStatusChange={refresh} />
        ))}
      </div>
    </section>
  );
};

export default Reminders;
