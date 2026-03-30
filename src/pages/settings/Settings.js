import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../../services/profileService';
import { useCurrency } from '../../context/currency';
const SUBSCRIPTION_WINDOW_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const subscriptionDateFormatter = new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
});
const Settings = () => {
    const { user, loading, signOut } = useAuth();
    const { selectedCurrency, setSelectedCurrency, availableCurrencies, loading: currencyLoading } = useCurrency();
    const navigate = useNavigate();
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState(null);
    const subscriptionInfo = useMemo(() => {
        if (!user) {
            return null;
        }
        const created = new Date(user.createdAt);
        if (!Number.isFinite(created.getTime())) {
            return null;
        }
        const due = new Date(created.getTime() + SUBSCRIPTION_WINDOW_DAYS * MS_PER_DAY);
        const now = new Date();
        const remainingMs = due.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(remainingMs / MS_PER_DAY));
        const elapsedMs = now.getTime() - created.getTime();
        const elapsedDays = Math.max(0, Math.min(SUBSCRIPTION_WINDOW_DAYS, Math.floor(elapsedMs / MS_PER_DAY)));
        const progress = Math.min(100, Math.round((elapsedDays / SUBSCRIPTION_WINDOW_DAYS) * 100));
        const isOverdue = now.getTime() > due.getTime();
        return {
            created,
            due,
            daysRemaining,
            progress,
            isOverdue
        };
    }, [user]);
    const subscriptionStatusText = subscriptionInfo
        ? subscriptionInfo.isOverdue
            ? 'Payment overdue - please settle immediately'
            : subscriptionInfo.daysRemaining === 0
                ? 'Payment due today'
                : `${subscriptionInfo.daysRemaining} day${subscriptionInfo.daysRemaining === 1 ? '' : 's'} until payment`
        : '';
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordMessage(null);
        // Validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'All fields are required' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }
        setPasswordLoading(true);
        try {
            // In a real app, verify old password by reauthenticating
            // For now, we'll just update to the new password
            const result = await changePassword(newPassword);
            if (result.success) {
                setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowPasswordForm(false);
            }
            else {
                setPasswordMessage({ type: 'error', text: result.error || 'Failed to change password' });
            }
        }
        catch (error) {
            setPasswordMessage({ type: 'error', text: 'An error occurred while changing password' });
        }
        finally {
            setPasswordLoading(false);
        }
    };
    if (loading) {
        return (_jsxs("section", { className: "space-y-4", children: [_jsx("div", { className: "page-header", children: _jsx("h1", { children: "Settings" }) }), _jsx("p", { children: "Loading user profile\u2026" })] }));
    }
    return (_jsxs("section", { className: "space-y-6", children: [_jsx("div", { className: "page-header", children: _jsx("h1", { children: "Settings" }) }), user ? (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "card", children: [_jsx("h2", { children: "User information" }), _jsxs("dl", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Name" }), _jsx("dd", { children: user.fullName })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Email" }), _jsx("dd", { children: user.email })] })] }), _jsx("div", { className: "mt-4", children: _jsx(Button, { type: "button", variant: "ghost", onClick: async () => {
                                        await signOut();
                                        navigate('/auth/login');
                                    }, children: "Logout" }) })] }), _jsxs("div", { className: "card space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { children: "Currency" }), currencyLoading && (_jsx("span", { className: "text-sm text-gray-500", children: "Updating exchange rates..." }))] }), _jsx("p", { className: "text-sm text-gray-500", children: "Choose the currency you want to see throughout the dashboard." }), _jsx("select", { className: "w-full max-w-xs rounded-lg border border-gray-200 p-2", value: selectedCurrency, onChange: (event) => setSelectedCurrency(event.target.value), disabled: currencyLoading, children: availableCurrencies.map((code) => (_jsx("option", { value: code, children: code }, code))) })] }), subscriptionInfo && (_jsxs("div", { className: "card space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("h2", { children: "Subscription" }), _jsx("span", { className: `text-xs font-semibold uppercase tracking-wide rounded-full px-3 py-1 border ${subscriptionInfo.isOverdue
                                            ? 'border-red-100 bg-red-50 text-red-700'
                                            : 'border-green-100 bg-green-50 text-green-700'}`, children: subscriptionInfo.isOverdue ? 'Overdue' : 'Active' })] }), _jsxs("div", { className: "grid gap-3 text-sm text-gray-500", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-gray-400", children: "Started" }), _jsx("p", { children: subscriptionDateFormatter.format(subscriptionInfo.created) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-gray-400", children: "Due" }), _jsx("p", { children: subscriptionDateFormatter.format(subscriptionInfo.due) })] })] }), _jsx("div", { className: "h-2 w-full rounded-full bg-gray-100", children: _jsx("div", { className: "h-full rounded-full bg-blue-600 transition-all duration-200", style: { width: `${subscriptionInfo.progress}%` } }) }), _jsx("p", { className: "text-lg font-semibold text-gray-900", children: subscriptionStatusText })] })), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { children: "Change Password" }), _jsx(Button, { type: "button", variant: "ghost", onClick: () => setShowPasswordForm(!showPasswordForm), children: showPasswordForm ? 'Hide' : 'Show' })] }), showPasswordForm && (_jsxs("form", { onSubmit: handlePasswordChange, className: "space-y-4", children: [_jsx(Input, { type: "password", label: "Current Password", value: oldPassword, onChange: (e) => setOldPassword(e.target.value), placeholder: "Enter your current password" }), _jsx(Input, { type: "password", label: "New Password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), placeholder: "Enter new password" }), _jsx(Input, { type: "password", label: "Confirm New Password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "Confirm new password" }), passwordMessage && (_jsx("div", { className: `p-3 rounded text-sm ${passwordMessage.type === 'success'
                                            ? 'bg-green-50 text-green-800 border border-green-200'
                                            : 'bg-red-50 text-red-800 border border-red-200'}`, children: passwordMessage.text })), _jsx("div", { className: "flex gap-2", children: _jsx(Button, { type: "submit", disabled: passwordLoading, children: passwordLoading ? 'Changing...' : 'Change Password' }) })] }))] })] })) : (_jsx("div", { className: "card", children: _jsx("p", { children: "No user signed in." }) }))] }));
};
export default Settings;
