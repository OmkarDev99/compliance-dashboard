import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, BarChart3, TrendingUp, Users, ShieldAlert } from 'lucide-react';
import { getReportsSummary, getCompaniesReports, getTeamReport } from '../services/reports';
import Loader, { Skeleton } from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [sortField, setSortField] = useState('compliance_score');
  const [sortOrder, setSortOrder] = useState('asc');

  const { data: summary, isLoading: isSummaryLoading } = useQuery({ queryKey: ['reports-summary'], queryFn: getReportsSummary });
  const { data: companiesReport, isLoading: isCompLoading } = useQuery({ queryKey: ['reports-companies'], queryFn: getCompaniesReports });
  const { data: teamReport, isLoading: isTeamLoading } = useQuery({ queryKey: ['reports-team'], queryFn: getTeamReport });

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const sortedCompanies = [...(companiesReport || [])].sort((a, b) => {
    let aVal = a[sortField]; let bVal = b[sortField];
    if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleExportCSV = () => {
    if (!companiesReport || companiesReport.length === 0) return;
    const headers = ['Company Name', 'Compliance Score (%)', 'Total Tasks', 'Completed Tasks', 'Overdue Tasks'];
    const rows = companiesReport.map((c) => [c.company_name, c.compliance_score, c.total_tasks, c.completed_tasks, c.overdue_tasks]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CS_Compliance_Reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isSummaryLoading || isCompLoading || isTeamLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-24" />)}
        </div>
      </div>
    );
  }

  const barData = [
    { month: 'Jan', Completed: 12, Overdue: 3 },
    { month: 'Feb', Completed: 18, Overdue: 2 },
    { month: 'Mar', Completed: 22, Overdue: 5 },
    { month: 'Apr', Completed: 15, Overdue: 4 },
    { month: 'May', Completed: 29, Overdue: 1 },
    { month: 'Jun', Completed: summary?.completed_count || 38, Overdue: summary?.overdue_count || 1 },
  ];

  const statCards = [
    { label: 'Total Companies', value: summary?.total_companies || 0, accent: '#2563EB', textColor: 'text-[#0F172A]' },
    { label: 'Overdue Tasks', value: summary?.overdue_count || 0, accent: '#EF4444', textColor: 'text-[#EF4444]' },
    { label: 'Due This Week', value: summary?.due_soon_count || 0, accent: '#F59E0B', textColor: 'text-[#F59E0B]' },
    { label: 'Completed', value: summary?.completed_count || 0, accent: '#3B82F6', textColor: 'text-[#3B82F6]' },
  ];

  const thCls = "p-4 cursor-pointer hover:text-[#0F172A] transition-colors";

  return (
    <div className="space-y-6 page-transition">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Compliance Reports</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Export records and evaluate team task completion velocities.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="h-9 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-md shrink-0 self-start md:self-auto"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white border border-[#E5E7EB] rounded-lg p-5 relative overflow-hidden shadow-sm">
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: s.accent }} />
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">{s.label}</span>
            <span className={`text-3xl font-bold font-mono mt-2 block ${s.textColor}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Company compliance table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-[#0F172A] text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            Company Standings
          </h2>
          {sortedCompanies.length === 0 ? (
            <EmptyState title="No metrics to aggregate" description="Seeded data or company creation triggers are needed to construct standings." />
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[10px] font-bold text-[#64748B] uppercase tracking-wider h-11 select-none">
                      <th className={thCls} onClick={() => handleSort('company_name')}>
                        Company Name {sortField === 'company_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className={thCls} onClick={() => handleSort('compliance_score')}>
                        Compliance Score {sortField === 'compliance_score' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className={thCls} onClick={() => handleSort('total_tasks')}>
                        Total {sortField === 'total_tasks' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className={thCls} onClick={() => handleSort('completed_tasks')}>
                        Completed {sortField === 'completed_tasks' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className={thCls} onClick={() => handleSort('overdue_tasks')}>
                        Overdue {sortField === 'overdue_tasks' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {sortedCompanies.map((c) => (
                      <tr key={c.company_id} className="h-11 hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-4 font-semibold text-[#0F172A]">{c.company_name}</td>
                        <td className="p-4">
                          <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${
                            c.compliance_score === 100
                              ? 'bg-[#22C55E]/10 text-[#22C55E]'
                              : c.compliance_score < 50
                              ? 'bg-[#EF4444]/10 text-[#EF4444]'
                              : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                          }`}>
                            {c.compliance_score}%
                          </span>
                        </td>
                        <td className="p-4 text-[#64748B] font-mono">{c.total_tasks}</td>
                        <td className="p-4 text-[#3B82F6] font-mono">{c.completed_tasks}</td>
                        <td className="p-4 text-[#EF4444] font-mono">{c.overdue_tasks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Chart + Team */}
        <div className="space-y-6">
          {/* Bar Chart */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 space-y-4 shadow-sm">
            <h2 className="text-[#0F172A] text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#2563EB]" />
              Filing Activity By Month
            </h2>
            <div className="h-48 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" stroke="#94A3B8" tickLine={false} />
                  <YAxis stroke="#94A3B8" tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px' }}
                    labelStyle={{ color: '#0F172A', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="Completed" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Overdue" fill="#EF4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Performance */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 space-y-4 shadow-sm">
            <h2 className="text-[#0F172A] text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#2563EB]" />
              Team Performance
            </h2>
            {teamReport && teamReport.length > 0 ? (
              <div className="space-y-3">
                {teamReport.map((member) => (
                  <div key={member.user_id} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-[#0F172A] font-medium">
                      <span>{member.user_name}</span>
                      <span className="font-mono text-[#64748B]">{member.completion_rate}% ({member.completed_tasks}/{member.total_tasks})</span>
                    </div>
                    <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2563EB] h-full rounded-full transition-all duration-300"
                        style={{ width: `${member.completion_rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#64748B] italic">No performance logs recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
