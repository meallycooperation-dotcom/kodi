import NotificationItem from '../../components/notifications/NotificationItem';
import useNotifications from '../../hooks/useNotifications';

const Notifications = () => {
  const { notifications, unreadCount, loading } = useNotifications();

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="page-header">
          <h1>Notifications</h1>
        </div>
        <p>Loading notifications…</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount} unread</p>
        </div>
      </div>
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))
      ) : (
        <div className="card">
          <p className="text-gray-500">No notifications yet</p>
        </div>
      )}
    </section>
  );
};

export default Notifications;
