import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import NotificationItem from '../../components/notifications/NotificationItem';
import useNotifications from '../../hooks/useNotifications';
const Notifications = () => {
    const { notifications, unreadCount, loading } = useNotifications();
    if (loading) {
        return (_jsxs("section", { className: "space-y-4", children: [_jsx("div", { className: "page-header", children: _jsx("h1", { children: "Notifications" }) }), _jsx("p", { children: "Loading notifications\u2026" })] }));
    }
    return (_jsxs("section", { className: "space-y-4", children: [_jsx("div", { className: "page-header", children: _jsxs("div", { children: [_jsx("h1", { children: "Notifications" }), _jsxs("p", { children: [unreadCount, " unread"] })] }) }), notifications.length > 0 ? (notifications.map((notification) => (_jsx(NotificationItem, { notification: notification }, notification.id)))) : (_jsx("div", { className: "card", children: _jsx("p", { className: "text-gray-500", children: "No notifications yet" }) }))] }));
};
export default Notifications;
