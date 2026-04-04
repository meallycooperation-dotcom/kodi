import { useEffect, useState } from 'react';
import type { Reminder } from '../../types/reminder';
import ReminderCard from '../../components/reminders/ReminderCard';
import ReminderForm from '../../components/reminders/ReminderForm';
import Button from '../../components/ui/Button';
import useReminders from '../../hooks/useReminders';

const Reminders = () => {
  const { reminders, refresh } = useReminders();
  const [showForm, setShowForm] = useState(false);
  const [localReminders, setLocalReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    setLocalReminders(reminders);
  }, [reminders]);

  const handleOptimisticDelete = (id: string) => {
    setLocalReminders((prev) => prev.filter((reminder) => reminder.id !== id));
  };

  const handleDeleteRollback = () => {
    refresh();
  };

  const handleOptimisticCreate = (reminder: Reminder) => {
    setLocalReminders((prev) => [reminder, ...prev]);
  };

  const handleCreateRollback = (tempId: string) => {
    setLocalReminders((prev) => prev.filter((reminder) => reminder.id !== tempId));
    refresh();
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Reminders</h1>
        <Button type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Hide Form' : 'Create Reminder'}
        </Button>
      </div>

      {showForm && (
        <ReminderForm
          onCreateOptimistic={handleOptimisticCreate}
          onCreateRollback={handleCreateRollback}
          onCreateSuccess={() => refresh()}
        />
      )}

      <div className="space-y-4">
        {localReminders.map((reminder) => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            onStatusChange={refresh}
            onDelete={refresh}
            onDeleteOptimistic={handleOptimisticDelete}
            onDeleteRollback={handleDeleteRollback}
          />
        ))}
      </div>
    </section>
  );
};

export default Reminders;
