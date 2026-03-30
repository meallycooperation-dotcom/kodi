import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
const NewPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sessionState, setSessionState] = useState('idle');
    const [sessionError, setSessionError] = useState('');
    const [formError, setFormError] = useState('');
    useEffect(() => {
        const restoreSession = async () => {
            setSessionState('loading');
            const { error: initError } = await supabase.auth.initialize();
            if (initError) {
                setSessionError(initError.message || 'We could not verify this password reset link. Please request a new one.');
                setSessionState('error');
                return;
            }
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                setSessionError(sessionError?.message || 'We could not verify this password reset link. Please request a new one.');
                setSessionState('error');
                return;
            }
            setSessionState('ready');
        };
        restoreSession();
    }, []);
    const canSubmit = sessionState === 'ready';
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!canSubmit) {
            return;
        }
        if (!password || !confirmPassword) {
            setFormError('Please fill out both password fields.');
            return;
        }
        if (password !== confirmPassword) {
            setFormError('Passwords must match.');
            return;
        }
        if (password.length < 8) {
            setFormError('Password should be at least 8 characters long.');
            return;
        }
        setFormError('');
        setSubmitting(true);
        const { error } = await supabase.auth.updateUser({ password });
        setSubmitting(false);
        if (error) {
            setFormError(error.message || 'Unable to update your password.');
            return;
        }
        await supabase.auth.signOut();
        navigate('/auth/login', { state: { passwordReset: true } });
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-100 p-4", children: _jsxs("form", { onSubmit: handleSubmit, className: "bg-white p-8 rounded-2xl shadow-lg w-full max-w-md", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center", children: "Create a new password" }), sessionState === 'loading' && (_jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Validating your reset link\u2026" })), sessionError && (_jsx("p", { className: "text-sm text-red-600 mb-4", role: "alert", children: sessionError })), _jsx("input", { type: "password", name: "password", placeholder: "New password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full mb-4 p-3 border rounded-lg", required: true, disabled: !canSubmit || submitting }), _jsx("input", { type: "password", name: "confirmPassword", placeholder: "Confirm password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: "w-full mb-4 p-3 border rounded-lg", required: true, disabled: !canSubmit || submitting }), formError && (_jsx("p", { className: "text-sm text-red-600 mb-4", role: "alert", children: formError })), _jsx("button", { type: "submit", disabled: !canSubmit || submitting, className: "w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50", children: submitting ? 'Updating password…' : 'Set new password' }), _jsx("div", { className: "text-center mt-4 text-sm", children: _jsx(Link, { to: "/auth/login", className: "text-purple-600 font-semibold", children: "Back to login" }) })] }) }));
};
export default NewPassword;
