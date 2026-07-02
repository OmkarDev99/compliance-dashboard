import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompanies, getCompany, createCompany, updateCompany, deleteCompany, getCompanyTasks } from '../services/clients';
import { toast } from 'react-hot-toast';

export const useClients = (filters = {}) => {
  return useQuery({
    queryKey: ['companies', filters],
    queryFn: () => getCompanies(filters),
    staleTime: 300000,  // 5 minutes
  });
};

export const useClientDetails = (clientId) => {
  return useQuery({
    queryKey: ['company', clientId],
    queryFn: () => getCompany(clientId),
    enabled: !!clientId,
    staleTime: 300000,
  });
};

export const useClientTasks = (clientId) => {
  return useQuery({
    queryKey: ['company-tasks', clientId],
    queryFn: () => getCompanyTasks(clientId),
    enabled: !!clientId,
    staleTime: 30000,
  });
};

export const useCreateClientMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      // The rules will have generated a set of tasks, invalidate those too
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Company added and tasks generated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || 'Failed to add company');
    },
  });
};

export const useUpdateClientMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateCompany(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
      toast.success('Company updated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || 'Failed to update company');
    },
  });
};

export const useDeleteClientMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteCompany(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      toast.success('Company deactivated successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || 'Failed to delete company');
    },
  });
};
