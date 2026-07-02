import { format, differenceInDays, parseISO } from 'date-fns';

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'dd MMM yyyy');
  } catch (error) {
    return dateString;
  }
};

export const getDaysRemaining = (dueDateString) => {
  if (!dueDateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = parseISO(dueDateString);
  dueDate.setHours(0, 0, 0, 0);
  return differenceInDays(dueDate, today);
};

export const getDeadlineColorClass = (dueDateString, isCompleted = false) => {
  if (isCompleted) return 'text-status-completed font-semibold';
  const days = getDaysRemaining(dueDateString);
  if (days === null) return 'text-text-secondary';
  if (days < 0) return 'text-status-overdue font-semibold';
  if (days <= 7) return 'text-status-due-soon font-semibold';
  return 'text-status-upcoming';
};

export const getDeadlineLabel = (dueDateString) => {
  const days = getDaysRemaining(dueDateString);
  if (days === null) return '';
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days} days remaining`;
};
