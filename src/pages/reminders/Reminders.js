import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import ReminderCard from '../../components/reminders/ReminderCard';
import ReminderForm from '../../components/reminders/ReminderForm';
import Button from '../../components/ui/Button';
import useReminders from '../../hooks/useReminders';
const Reminders = () => {
    const { reminders, refresh } = useReminders();
    const [showForm, setShowForm] = useState(false);
    return (_jsxs("section", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { children: "Reminders" }), _jsx(Button, { type: "button", onClick: () => setShowForm((v) => !v), children: showForm ? 'Hide Form' : 'Create Reminder' })] }), showForm && _jsx(ReminderForm, {}), _jsx("div", { className: "space-y-4", children: reminders.map((reminder) => (_jsx(ReminderCard, { reminder: reminder, onStatusChange: refresh }, reminder.id))) })] }));
};
export default Reminders;
