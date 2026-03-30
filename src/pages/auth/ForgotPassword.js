import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            return alert('Please enter your email.');
        }
        try {
            setLoading(true);
            setSuccess('');
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: window.location.origin + '/auth/new-password',
            });
            if (error)
                throw error;
            setSuccess('If that email exists, a password reset link has been sent. Check your inbox.');
        }
        catch (err) {
            alert(err.message || 'Failed to send reset email');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-100", children: _jsxs("form", { onSubmit: handleSubmit, className: "bg-white p-8 rounded-2xl shadow-lg w-full max-w-md", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center", children: "Forgot Password" }), _jsx("input", { type: "email", name: "email", placeholder: "Enter your email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full mb-4 p-3 border rounded-lg", required: true }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50", children: loading ? 'Sending...' : 'Send reset link' }), success && _jsx("p", { className: "text-green-600 mt-4 text-center", children: success }), _jsx("div", { className: "text-center mt-4 text-sm", children: _jsx("a", { href: "/auth/login", className: "text-purple-600 font-semibold", children: "Back to login" }) })] }) }));
};
export default ForgotPassword;
