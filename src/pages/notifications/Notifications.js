import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import NotificationItem from '../../components/notifications/NotificationItem';
import useNotifications from '../../hooks/useNotifications';
const Notifications = () => {
    const { notifications, unreadCount } = useNotifications();
    return (_jsxs("section", { className: "space-y-4", children: [_jsx("div", { className: "page-header", children: _jsxs("div", { children: [_jsx("h1", { children: "Notifications" }), _jsxs("p", { children: [unreadCount, " unread"] })] }) }), notifications.map((notification) => (_jsx(NotificationItem, { notification: notification }, notification.id)))] }));
};
export default Notifications;
