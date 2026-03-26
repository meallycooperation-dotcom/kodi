import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Button from '../../components/ui/Button';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
const Settings = () => {
    const { user, loading, signOut } = useAuth();
    const navigate = useNavigate();
    if (loading) {
        return (_jsxs("section", { className: "space-y-4", children: [_jsx("div", { className: "page-header", children: _jsx("h1", { children: "Settings" }) }), _jsx("p", { children: "Loading user profile\u2026" })] }));
    }
    return (_jsxs("section", { className: "space-y-6", children: [_jsx("div", { className: "page-header", children: _jsx("h1", { children: "Settings" }) }), user ? (_jsxs("div", { className: "card", children: [_jsx("h2", { children: "User information" }), _jsxs("dl", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Name" }), _jsx("dd", { children: user.fullName })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Email" }), _jsx("dd", { children: user.email })] })] }), _jsx("div", { className: "mt-4", children: _jsx(Button, { type: "button", variant: "ghost", onClick: async () => {
                                await signOut();
                                navigate('/auth/login');
                            }, children: "Logout" }) })] })) : (_jsx("div", { className: "card", children: _jsx("p", { children: "No user signed in." }) }))] }));
};
export default Settings;
