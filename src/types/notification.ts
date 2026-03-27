export type Notification = {
  id: string;
  creatorId: string;
  title: string;
  message: string;
  type: 'payment' | 'arrears' | 'reminder' | 'system';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
};
