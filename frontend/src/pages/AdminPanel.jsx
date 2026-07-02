import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, Settings, BookOpen, ToggleLeft, ToggleRight, Edit, X } from 'lucide-react';
import { getUsers, createUser, updateUser, getRules, createRule, updateRule } from '../services/auth';
import Loader, { TableRowSkeleton } from '../components/Loader';
import Modal from '../components/Modal';
import { toast } from 'react-hot-toast';

const AdminPanel = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '', role: 'staff', is_active: true });
  const [ruleForm, setRuleForm] = useState({ name: '', form_number: '', company_types: [], frequency: 'annual', due_days_from_trigger: 30, description: '', is_active: true });

  const { data: users, isLoading: isUsersLoading } = useQuery({ queryKey: ['admin-users'], queryFn: getUsers });
  const { data: rules, isLoading: isRulesLoading } = useQuery({ queryKey: ['admin-rules'], queryFn: getRules });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsUserModalOpen(false);
      setUserForm({ email: '', password: '', full_name: '', role: 'staff', is_active: true });
      toast.success('User invited successfully');
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to invite user'),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User profile updated'); },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to update user'),
  });

  const createRuleMutation = useMutation({
    mutationFn: createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] });
      setIsRuleModalOpen(false);
      setRuleForm({ name: '', form_number: '', company_types: [], frequency: 'annual', due_days_from_trigger: 30, description: '', is_active: true });
      toast.success('Compliance rule added');
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to add rule'),
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rules'] });
      setIsRuleModalOpen(false); setEditingRule(null);
      setRuleForm({ name: '', form_number: '', company_types: [], frequency: 'annual', due_days_from_trigger: 30, description: '', is_active: true });
      toast.success('Compliance rule updated');
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to update rule'),
  });

  const handleUserInputChange = (e) => { const { name, value } = e.target; setUserForm((prev) => ({ ...prev, [name]: value })); };
  const handleRuleInputChange = (e) => { const { name, value } = e.target; setRuleForm((prev) => ({ ...prev, [name]: value })); };

  const handleCompanyTypesToggle = (type) => {
    setRuleForm((prev) => {
      const updated = prev.company_types.includes(type)
        ? prev.company_types.filter((t) => t !== type)
        : [...prev.company_types, type];
      return { ...prev, company_types: updated };
    });
  };

  const handleUserSubmit = (e) => { e.preventDefault(); createUserMutation.mutate(userForm); };

  const handleRuleSubmit = (e) => {
    e.preventDefault();
    if (ruleForm.company_types.length === 0) { alert('Please select at least one applicable company type'); return; }
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data: ruleForm });
    } else {
      createRuleMutation.mutate(ruleForm);
    }
  };

  const startEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({ name: rule.name, form_number: rule.form_number || '', company_types: rule.company_types, frequency: rule.frequency, due_days_from_trigger: rule.due_days_from_trigger, description: rule.description || '', is_active: rule.is_active });
    setIsRuleModalOpen(true);
  };

  const inputCls = "w-full h-9 bg-[#F8FAFC] border border-[#E5E7EB] rounded-md px-3 text-[#0F172A] placeholder-[#94A3B8] outline-none text-xs focus:border-[#2563EB]";
  const labelCls = "block text-xs font-bold text-[#64748B] uppercase tracking-wide";
  const thCls = "p-4 font-bold text-[#64748B] text-[10px] uppercase tracking-wider";

  return (
    <div className="space-y-6 page-transition">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Admin Administration</h1>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">Control system access, user profiles, and compliance rules checklists.</p>
        </div>
        {activeTab === 'users' ? (
          <button onClick={() => setIsUserModalOpen(true)} className="h-9 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-md">
            <UserPlus className="w-4 h-4" /> Invite User
          </button>
        ) : (
          <button onClick={() => { setEditingRule(null); setIsRuleModalOpen(true); }} className="h-9 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-md">
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E7EB] flex space-x-6 text-sm font-semibold">
        {[
          { id: 'users', icon: Settings, label: 'Users' },
          { id: 'rules', icon: BookOpen, label: 'Compliance Rules' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`pb-3 transition-colors flex items-center gap-2 ${
              activeTab === id ? 'border-b-2 border-[#2563EB] text-[#2563EB]' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm">
        {/* USERS TABLE */}
        {activeTab === 'users' && (
          isUsersLoading ? (
            <table className="w-full text-left text-xs border-collapse"><tbody>{Array.from({ length: 3 }).map((_, idx) => <TableRowSkeleton key={idx} cols={4} />)}</tbody></table>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#64748B] uppercase tracking-wider h-10">
                    <th className={thCls}>Name</th>
                    <th className={thCls}>Email</th>
                    <th className={thCls}>Role</th>
                    <th className={thCls}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {users?.map((userObj) => (
                    <tr key={userObj.id} className="h-12 hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-4 font-semibold text-[#0F172A]">{userObj.full_name || 'CS Agent'}</td>
                      <td className="p-4 text-[#64748B] font-mono">{userObj.email}</td>
                      <td className="p-4">
                        <select
                          value={userObj.role}
                          onChange={(e) => updateUserMutation.mutate({ id: userObj.id, data: { role: e.target.value } })}
                          className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-md h-8 text-xs text-[#0F172A] px-2 outline-none"
                        >
                          <option value="admin">Admin</option>
                          <option value="staff">Staff</option>
                          <option value="partner">Partner</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <button onClick={() => updateUserMutation.mutate({ id: userObj.id, data: { is_active: !userObj.is_active } })} className="p-1 hover:bg-[#F1F5F9] rounded-md text-[#64748B] transition-all">
                          {userObj.is_active ? <ToggleRight className="w-6 h-6 text-[#22C55E]" /> : <ToggleLeft className="w-6 h-6 text-[#EF4444]" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* RULES TABLE */}
        {activeTab === 'rules' && (
          isRulesLoading ? (
            <table className="w-full text-left text-xs border-collapse"><tbody>{Array.from({ length: 3 }).map((_, idx) => <TableRowSkeleton key={idx} cols={5} />)}</tbody></table>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[10px] font-bold text-[#64748B] uppercase tracking-wider h-10">
                    <th className={thCls}>Rule Name</th>
                    <th className={thCls}>Form</th>
                    <th className={thCls}>Applicable Types</th>
                    <th className={thCls}>Days From Trigger</th>
                    <th className={thCls}>Active</th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {rules?.map((rule) => (
                    <tr key={rule.id} className="h-12 hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-4 font-semibold text-[#0F172A] max-w-xs truncate" title={rule.description}>{rule.name}</td>
                      <td className="p-4 font-mono text-[#64748B]">
                        {rule.form_number ? (
                          <span className="bg-[#2563EB]/10 text-[#2563EB] px-1.5 py-0.5 rounded text-[10px] font-bold">{rule.form_number}</span>
                        ) : '-'}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-[#64748B] uppercase max-w-[150px] truncate">{rule.company_types.join(', ').replace(/_/g, ' ')}</td>
                      <td className="p-4 font-mono text-[#64748B]">{rule.due_days_from_trigger} days</td>
                      <td className="p-4">
                        <button onClick={() => updateRuleMutation.mutate({ id: rule.id, data: { is_active: !rule.is_active } })} className="p-1 text-[#64748B]">
                          {rule.is_active ? <ToggleRight className="w-6 h-6 text-[#22C55E]" /> : <ToggleLeft className="w-6 h-6 text-[#EF4444]" />}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => startEditRule(rule)} className="p-1 hover:bg-[#F1F5F9] rounded-md text-[#64748B] hover:text-[#0F172A] transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Invite User Modal */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Invite Team Member">
        <form onSubmit={handleUserSubmit} className="space-y-4">
          {[
            { label: 'Full Name', name: 'full_name', type: 'text', placeholder: 'Rahul Sharma', value: userForm.full_name },
            { label: 'Email Address', name: 'email', type: 'email', placeholder: 'rahul@csdashboard.com', value: userForm.email },
            { label: 'Initial Password', name: 'password', type: 'password', placeholder: 'Minimum 6 characters', value: userForm.password },
          ].map((field) => (
            <div key={field.name} className="space-y-1.5">
              <label className={labelCls}>{field.label}</label>
              <input type={field.type} name={field.name} required placeholder={field.placeholder} value={field.value} onChange={handleUserInputChange} className={inputCls} />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className={labelCls}>Role</label>
            <select name="role" value={userForm.role} onChange={handleUserInputChange} className={inputCls}>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="partner">Partner</option>
            </select>
          </div>
          <div className="flex justify-end pt-3">
            <button type="submit" disabled={createUserMutation.isPending} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold px-4 py-2 rounded-md transition-colors shadow-md disabled:opacity-50">
              Invite User
            </button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Rule Modal */}
      <Modal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} title={editingRule ? 'Edit Compliance Rule' : 'Create Compliance Rule'}>
        <form onSubmit={handleRuleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Rule Name</label>
            <input type="text" name="name" required placeholder="Annual Return Filing" value={ruleForm.name} onChange={handleRuleInputChange} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Form Number (optional)</label>
            <input type="text" name="form_number" placeholder="e.g. MGT-7" value={ruleForm.form_number} onChange={handleRuleInputChange} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Applicable Company Types</label>
            <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-md p-3">
              {[
                { type: 'private_limited', label: 'Private Limited' },
                { type: 'public_limited', label: 'Public Limited' },
                { type: 'llp', label: 'LLP' },
                { type: 'opc', label: 'OPC' },
              ].map((item) => {
                const checked = ruleForm.company_types.includes(item.type);
                return (
                  <label key={item.type} className="flex items-center space-x-2.5 text-xs text-[#0F172A] cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={() => handleCompanyTypesToggle(item.type)} className="rounded border-[#E5E7EB] text-[#2563EB]" />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Frequency</label>
              <select name="frequency" value={ruleForm.frequency} onChange={handleRuleInputChange} className={inputCls}>
                <option value="annual">Annual</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
                <option value="event_based">Event-Based</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Due Days from trigger</label>
              <input type="number" name="due_days_from_trigger" required min={0} value={ruleForm.due_days_from_trigger} onChange={handleRuleInputChange} className={inputCls} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Description</label>
            <textarea name="description" rows={3} placeholder="Compliance explanation..." value={ruleForm.description} onChange={handleRuleInputChange} className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-md p-3 text-[#0F172A] placeholder-[#94A3B8] outline-none text-xs focus:border-[#2563EB]" />
          </div>
          <div className="flex justify-end pt-3">
            <button type="submit" disabled={createRuleMutation.isPending || updateRuleMutation.isPending} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold px-4 py-2 rounded-md transition-colors shadow-md disabled:opacity-50">
              {editingRule ? 'Update Rule' : 'Add Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPanel;
