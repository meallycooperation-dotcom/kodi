import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
const CheckEmailSent = () => {
    const location = useLocation();
    const email = location.state?.email;
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-100 p-4", children: _jsxs("div", { className: "bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Check your email" }), _jsxs("p", { className: "text-gray-700 mb-4", children: ["A password reset link has been sent to", ' ', _jsx("strong", { children: email || 'your email address' }), "."] }), _jsx("p", { className: "text-gray-600 mb-6", children: "Open your inbox and click the link. If you don\u2019t see it, check your spam folder." }), _jsx(Link, { to: "/auth/login", className: "w-full block bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700", children: "Back to login" })] }) }));
};
export default CheckEmailSent;
