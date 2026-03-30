export const formatDate = (date) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
