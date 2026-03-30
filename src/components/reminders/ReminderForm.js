import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { insertReminder } from '../../services/reminderService';
import useAuth from '../../hooks/useAuth';
import useReminders from '../../hooks/useReminders';
const ReminderForm = () => {
    const { user } = useAuth();
    const { refresh } = useReminders();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [form, setForm] = useState({
        title: '',
        message: '',
        sendDate: '',
        reminderStatus: 'pending'
    });
    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };
    const handleSubmit = async (event) => {
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
                status: form.reminderStatus
            });
            setStatus('Reminder created successfully.');
            setForm({
                title: '',
                message: '',
                sendDate: '',
                reminderStatus: 'pending'
            });
            await refresh(); // Refresh the reminders list
        }
        catch (error) {
            console.error(error);
            setStatus('Failed to create reminder.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("form", { className: "reminder-form space-y-4", onSubmit: handleSubmit, children: [_jsx(Input, { label: "Title", name: "title", value: form.title, onChange: (event) => handleChange('title', event.target.value), placeholder: "e.g. Payment follow-up", required: true }), _jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Message" }), _jsx("textarea", { value: form.message, onChange: (event) => handleChange('message', event.target.value), className: "w-full p-3 border rounded-lg", placeholder: "Enter reminder message", rows: 4, required: true })] }), _jsx(Input, { label: "Send Date", name: "sendDate", type: "datetime-local", value: form.sendDate, onChange: (event) => handleChange('sendDate', event.target.value), required: true }), _jsxs("label", { className: "input-field", children: [_jsx("span", { children: "Status" }), _jsxs("select", { value: form.reminderStatus, onChange: (event) => handleChange('reminderStatus', event.target.value), className: "w-full p-3 border rounded-lg", children: [_jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "sent", children: "Sent" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] })] }), _jsx(Button, { type: "submit", disabled: loading, children: loading ? 'Creating…' : 'Create Reminder' }), status && _jsx("p", { children: status })] }));
};
export default ReminderForm;
