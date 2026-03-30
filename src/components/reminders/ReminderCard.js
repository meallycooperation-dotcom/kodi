import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { updateReminder } from '../../services/reminderService';
const ReminderCard = ({ reminder, onStatusChange }) => {
    const [status, setStatus] = useState(reminder.status);
    const [updating, setUpdating] = useState(false);
    const handleStatusChange = async (newStatus) => {
        setUpdating(true);
        try {
            await updateReminder(reminder.id, newStatus);
            setStatus(newStatus);
            onStatusChange?.();
        }
        catch (error) {
            console.error('Failed to update reminder status', error);
        }
        finally {
            setUpdating(false);
        }
    };
    return (_jsxs("article", { className: "reminder-card", children: [_jsxs("div", { className: "reminder-card__header", children: [_jsx("h3", { children: reminder.title }), _jsxs("select", { value: status, onChange: (e) => handleStatusChange(e.target.value), disabled: updating, className: "px-3 py-1 border rounded-lg text-sm", children: [_jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "sent", children: "Completed" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] })] }), _jsx("p", { children: reminder.message }), _jsx("small", { children: new Date(reminder.sendDate).toLocaleString() })] }));
};
export default ReminderCard;
