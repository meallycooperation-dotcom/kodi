import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Badge from '../ui/Badge';
const NotificationItem = ({ notification }) => (_jsxs("article", { className: "notification-item", children: [_jsxs("div", { className: "notification-item__header", children: [_jsx("h3", { children: notification.title }), _jsx(Badge, { status: notification.read ? 'success' : 'pending', children: notification.type })] }), _jsx("p", { children: notification.message }), _jsx("small", { children: new Date(notification.createdAt).toLocaleString() })] }));
export default NotificationItem;
