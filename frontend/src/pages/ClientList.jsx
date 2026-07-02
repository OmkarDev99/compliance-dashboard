import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, X } from 'lucide-react';
import { useClients, useCreateClientMutation } from '../hooks/useClients';
import { getUsers } from '../services/auth';
import Loader, { TableRowSkeleton } from '../components/Loader';
import EmptyState from '../components/EmptyState';

const ClientList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    cin: '',
    company_type: 'private_limited',
    reg_date: '',
    financial_year_end: '2026-03-31',
    assigned_to: '',
    address: '',
  });

  const activeParam = activeTab === 'all' ? undefined : activeTab === 'active';
  const { data: companies, isLoading } = useClients({ is_active: activeParam });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const createClientMutation = useCreateClientMutation();

  useEffect(() => {
    if (location.state?.openAddDrawer) {
      setIsAddDrawerOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.cin.length !== 21) {
      alert('CIN must be exactly 21 characters long');
      return;
    }
    createClientMutation.mutate(
      { ...formData, assigned_to: formData.assigned_to ? formData.assigned_to : null },
      {
        onSuccess: () => {
          setIsAddDrawerOpen(false);
          setFormData({ name: '', cin: '', company_type: 'private_limited', reg_date: '', financial_year_end: '2026-03-31', assigned_to: '', address: '' });
        },
      }
    );
  };

  const filteredCompanies = companies?.filter((c) => {
    const query = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(query) || c.cin.toLowerCase().includes(query);
  }) || [];

  const inputCls = "w-full h-9 bg-[#F8FAFC] border border-[#E5E7EB] rounded-md px-3 text-[#0F172A] placeholder-[#94A3B8] outline-none text-xs focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10";
  const labelCls = "block text-xs font-bold text-[#64748B] uppercase tracking-wide";

  return (
    <div className="space-y-6 page-transition">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Client Companies</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Manage details and compliance task associations for client firms.</p>
        </div>
        <button
          onClick={() => setIsAddDrawerOpen(true)}
          className="h-9 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-md shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-sm">
        <div className="flex bg-[#F8FAFC] p-1 border border-[#E5E7EB] rounded-lg w-fit">
          {['all', 'active', 'inactive'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white text-[#2563EB] border border-[#E5E7EB] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-[#F8FAFC] border border-[#E5E7EB] rounded-md px-3 py-2 text-sm w-full md:max-w-xs focus-within:border-[#2563EB] transition-colors">
          <Search className="w-4 h-4 text-[#64748B] mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search by company name or CIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-[#0F172A] placeholder-[#94A3B8] outline-none text-xs w-full"
          />
        </div>
      </div>

      {/* Client Table */}
      {isLoading ? (
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] h-10">
                {['Company Name', 'CIN', 'Type', 'Assigned CS', 'Status'].map((h) => (
                  <th key={h} className="p-4 font-bold text-[#64748B] uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, idx) => (
                <TableRowSkeleton key={idx} cols={5} />
              ))}
            </tbody>
          </table>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <EmptyState
          title="No Companies Found"
          description="Try modifying your filters or add a new client company to generate compliance tracks."
          actionLabel="Add Client"
          onActionClick={() => setIsAddDrawerOpen(true)}
        />
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[10px] font-bold text-[#64748B] uppercase tracking-wider h-11">
                  <th className="p-4">Company Name</th>
                  <th className="p-4">CIN</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Assigned CS</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredCompanies.map((company) => {
                  const assignedUser = users?.find((u) => u.id === company.assigned_to);
                  return (
                    <tr
                      key={company.id}
                      onClick={() => navigate(`/clients/${company.id}`)}
                      className="h-12 hover:bg-[#F8FAFC] cursor-pointer transition-all duration-150 group"
                    >
                      <td className="p-4 font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate max-w-xs">
                        {company.name}
                      </td>
                      <td className="p-4 font-mono text-[#64748B] tracking-tight truncate max-w-[180px]">
                        {company.cin}
                      </td>
                      <td className="p-4 font-mono uppercase text-[10px] text-[#64748B]">
                        {company.company_type.replace('_', ' ')}
                      </td>
                      <td className="p-4 text-[#0F172A]">
                        {assignedUser ? assignedUser.full_name || assignedUser.email : 'Unassigned'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded uppercase ${
                          company.is_active
                            ? 'bg-[#22C55E]/10 text-[#22C55E]'
                            : 'bg-[#EF4444]/10 text-[#EF4444]'
                        }`}>
                          {company.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Client Drawer */}
      {isAddDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-[2px] z-40" onClick={() => setIsAddDrawerOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-[480px] h-screen bg-white border-l border-[#E5E7EB] shadow-2xl flex flex-col">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
              <h3 className="text-[#0F172A] text-sm font-bold uppercase tracking-wider">Add Client Company</h3>
              <button
                onClick={() => setIsAddDrawerOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-md hover:bg-[#F1F5F9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Company Name</label>
                <input type="text" name="name" required placeholder="TechSolutions Private Limited" value={formData.name} onChange={handleInputChange} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Corporate Identity Number (CIN)</label>
                <input type="text" name="cin" required maxLength={21} minLength={21} placeholder="U74140DL2015PTC288888" value={formData.cin} onChange={handleInputChange} className={`${inputCls} font-mono`} />
                <span className="text-[10px] text-[#64748B] block">Exactly 21 characters</span>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Company Type</label>
                <select name="company_type" value={formData.company_type} onChange={handleInputChange} className={inputCls}>
                  <option value="private_limited">Private Limited</option>
                  <option value="public_limited">Public Limited</option>
                  <option value="llp">LLP</option>
                  <option value="opc">One Person Company (OPC)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Registration Date</label>
                <input type="date" name="reg_date" required value={formData.reg_date} onChange={handleInputChange} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Financial Year End</label>
                <input type="date" name="financial_year_end" required value={formData.financial_year_end} onChange={handleInputChange} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Assign To CS</label>
                <select name="assigned_to" value={formData.assigned_to} onChange={handleInputChange} className={inputCls}>
                  <option value="">Unassigned</option>
                  {users?.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Address</label>
                <textarea name="address" rows={3} placeholder="Registered Office Address..." value={formData.address} onChange={handleInputChange} className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-md p-3 text-[#0F172A] placeholder-[#94A3B8] outline-none text-xs focus:border-[#2563EB]" />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={createClientMutation.isPending}
                  className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-md flex items-center justify-center transition-colors shadow-md disabled:opacity-50"
                >
                  {createClientMutation.isPending ? 'Generating tasks...' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ClientList;
