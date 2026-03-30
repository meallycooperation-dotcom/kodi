import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import "../../styles/index.css";
const Signup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
    });
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        const trimmedFullName = form.fullName.trim();
        const trimmedEmail = form.email.trim().toLowerCase();
        const sanitizedPhone = form.phoneNumber.replace(/[^+0-9]/g, '');
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!trimmedFullName) {
            alert("Full name is required");
            return;
        }
        if (!trimmedEmail) {
            alert("Email is required");
            return;
        }
        if (!phoneRegex.test(sanitizedPhone)) {
            alert("Phone number must be in international format (10-15 digits, optional leading +)");
            return;
        }
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signUp({
                email: trimmedEmail,
                password: form.password,
            });
            if (error)
                throw error;
            const user = data.user;
            if (!user)
                throw new Error("Failed to create user");
            const { error: profileError } = await supabase.from("profiles").insert({
                id: user.id,
                full_name: trimmedFullName,
                email: trimmedEmail,
                phone_number: sanitizedPhone,
            });
            if (profileError)
                throw profileError;
            alert("Account created successfully 🎉");
            localStorage.setItem('pendingVerificationEmail', trimmedEmail);
            navigate('/auth/confirm-email', { state: { email: trimmedEmail } });
        }
        catch (err) {
            alert(err.message || "Sign up failed");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-100", children: _jsxs("form", { onSubmit: handleSubmit, className: "bg-white p-8 rounded-2xl shadow-lg w-full max-w-md", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center", children: "Create Kodi Account" }), _jsx("input", { type: "text", name: "fullName", placeholder: "Full Name", value: form.fullName, onChange: handleChange, className: "w-full mb-4 p-3 border rounded-lg", required: true }), _jsx("input", { type: "email", name: "email", placeholder: "Email", value: form.email, onChange: handleChange, className: "w-full mb-4 p-3 border rounded-lg", required: true }), _jsx("input", { type: "tel", name: "phoneNumber", placeholder: "Phone Number", value: form.phoneNumber, onChange: handleChange, className: "w-full mb-4 p-3 border rounded-lg", required: true }), _jsx("input", { type: "password", name: "password", placeholder: "Password", value: form.password, onChange: handleChange, className: "w-full mb-4 p-3 border rounded-lg", required: true }), _jsx("input", { type: "password", name: "confirmPassword", placeholder: "Confirm Password", value: form.confirmPassword, onChange: handleChange, className: "w-full mb-6 p-3 border rounded-lg", required: true }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50", children: loading ? "Creating..." : "Sign Up" }), _jsx("div", { className: "text-center mt-4 text-sm", children: _jsxs("p", { children: ["Already have an account?", ' ', _jsx("a", { href: "/auth/login", className: "text-purple-600 font-semibold", children: "Login" })] }) })] }) }));
};
export default Signup;
