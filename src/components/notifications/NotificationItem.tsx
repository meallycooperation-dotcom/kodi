import Badge from '../ui/Badge';
import type { Notification } from '../../types/notification';

type NotificationItemProps = {
  notification: Notification;
};

const NotificationItem = ({ notification }: NotificationItemProps) => (
  <article className="notification-item">
    <div className="notification-item__header">
      <h3>{notification.title}</h3>
      <Badge status={notification.isRead ? 'success' : 'pending'}>{notification.type}</Badge>
    </div>
    <p>{notification.message}</p>
    <small>{new Date(notification.createdAt).toLocaleString()}</small>
  </article>
);

export default NotificationItem;
