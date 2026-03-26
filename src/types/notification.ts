export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'payment' | 'reminder';
  read: boolean;
  createdAt: string;
};
