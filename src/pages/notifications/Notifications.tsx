import NotificationItem from '../../components/notifications/NotificationItem';
import useNotifications from '../../hooks/useNotifications';

const Notifications = () => {
  const { notifications, unreadCount } = useNotifications();

  return (
    <section className="space-y-4">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount} unread</p>
        </div>
      </div>
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </section>
  );
};

export default Notifications;
