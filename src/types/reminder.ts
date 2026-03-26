export type Reminder = {
  id: string;
  userId: string;
  title: string;
  message: string;
  sendDate: string;
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: string;
};
