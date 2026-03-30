import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import "../../styles/index.css";
const Login = () => {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                window.location.href = "/dashboard";
            }
        };
        checkUser();
    }, []);
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password,
            });
            if (error)
                throw error;
            // ✅ success
            // alert("Login successful 🎉");
            // 👉 redirect to dashboard
            window.location.href = "/dashboard";
        }
        catch (err) {
            alert(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-100", children: _jsxs("form", { onSubmit: handleLogin, className: "bg-white p-8 rounded-2xl shadow-lg w-full max-w-md", children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-center", children: "Login to Kodi" }), _jsx("input", { type: "email", name: "email", placeholder: "Email", value: form.email, onChange: handleChange, className: "w-full mb-4 p-3 border rounded-lg", required: true }), _jsx("input", { type: "password", name: "password", placeholder: "Password", value: form.password, onChange: handleChange, className: "w-full mb-6 p-3 border rounded-lg", required: true }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50", children: loading ? "Logging in..." : "Login" }), _jsxs("div", { className: "text-center mt-4 text-sm space-y-2", children: [_jsx("p", { children: _jsx("a", { href: "/auth/forgot-password", className: "text-purple-600 font-semibold", children: "Forgot password?" }) }), _jsxs("p", { children: ["Don\u2019t have an account?", " ", _jsx("a", { href: "/auth/signup", className: "text-purple-600 font-semibold", children: "Sign up" })] })] })] }) }));
};
export default Login;
