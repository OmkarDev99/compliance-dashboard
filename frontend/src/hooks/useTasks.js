import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, getTask, updateTask, completeTask, reopenTask, deleteTask } from '../services/tasks';
import { toast } from 'react-hot-toast';

export const useTasks = (filters = {}) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => getTasks(filters),
    staleTime: 30000, // 30 seconds
  });
};

export const useTaskDetails = (taskId) => {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId),
    enabled: !!taskId,
    staleTime: 30000,
  });
};

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
      if (data?.company_id) {
        queryClient.invalidateQueries({ queryKey: ['company', data.company_id] });
      }
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || 'Failed to update task');
    },
  });
};

export const useCompleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => completeTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      await queryClient.cancelQueries({ queryKey: ['task', id] });

      const previousTasks = queryClient.getQueryData(['tasks']);
      const previousTaskDetails = queryClient.getQueryData(['task', id]);

      if (previousTasks) {
        queryClient.setQueryData(
          ['tasks'],
          previousTasks.map((t) => (t.id === id ? { ...t, status: 'completed' } : t))
        );
      }

      if (previousTaskDetails) {
        queryClient.setQueryData(['task', id], { ...previousTaskDetails, status: 'completed' });
      }

      return { previousTasks, previousTaskDetails };
    },
    onError: (err, id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      if (context?.previousTaskDetails) {
        queryClient.setQueryData(['task', id], context.previousTaskDetails);
      }
      toast.error('Failed to complete task');
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      if (data?.company_id) {
        queryClient.invalidateQueries({ queryKey: ['company', data.company_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      toast.success('Task completed successfully');
    },
  });
};

export const useReopenTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => reopenTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      await queryClient.cancelQueries({ queryKey: ['task', id] });

      const previousTasks = queryClient.getQueryData(['tasks']);
      const previousTaskDetails = queryClient.getQueryData(['task', id]);

      if (previousTasks) {
        queryClient.setQueryData(
          ['tasks'],
          previousTasks.map((t) => (t.id === id ? { ...t, status: 'upcoming' } : t))
        );
      }

      if (previousTaskDetails) {
        queryClient.setQueryData(['task', id], { ...previousTaskDetails, status: 'upcoming' });
      }

      return { previousTasks, previousTaskDetails };
    },
    onError: (err, id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      if (context?.previousTaskDetails) {
        queryClient.setQueryData(['task', id], context.previousTaskDetails);
      }
      toast.error('Failed to reopen task');
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      if (data?.company_id) {
        queryClient.invalidateQueries({ queryKey: ['company', data.company_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      toast.success('Task reopened successfully');
    },
  });
};

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteTask(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || 'Failed to delete task');
    },
  });
};
