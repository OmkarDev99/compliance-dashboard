import React, { useState } from 'react';
import { FileSpreadsheet, ArrowRight, Printer, Share2, PlusCircle, CheckCircle } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const FinancialStatements = () => {
  const { isCS } = useWorkspace();
  const [activeTab, setActiveTab] = useState('pl'); // 'pl', 'bs', 'tb', 'cf'

  // Mock Profit & Loss Data
  const plData = {
    revenue: [
      { name: 'Sales Revenue (Product)', amount: 2450000 },
      { name: 'Service & Maintenance Fees', amount: 890000 },
      { name: 'Other Operating Income', amount: 120000 }
    ],
    expenses: [
      { name: 'Cost of Goods Sold (COGS)', amount: 1120000 },
      { name: 'Employee Salaries & Benefits', amount: 680000 },
      { name: 'Office rent & Utilities', amount: 150000 },
      { name: 'Marketing & Advertisements', amount: 180000 },
      { name: 'Professional & Legal Fees', amount: 75000 },
      { name: 'Depreciation & Amortization', amount: 45000 }
    ]
  };

  // Mock Balance Sheet Data
  const bsData = {
    assets: [
      { category: 'Non-Current Assets', items: [
        { name: 'Property, Plant & Equipment', amount: 1850000 },
        { name: 'Intangible Assets (Software)', amount: 240000 }
      ]},
      { category: 'Current Assets', items: [
        { name: 'Inventories & Raw Stock', amount: 450000 },
        { name: 'Trade Receivables (Debtors)', amount: 620000 },
        { name: 'Cash and Bank Balances', amount: 1280000 }
      ]}
    ],
    liabilities: [
      { category: 'Equity & Share Capital', items: [
        { name: 'Share Capital', amount: 2000000 },
        { name: 'Retained Earnings', amount: 1680000 }
      ]},
      { category: 'Non-Current Liabilities', items: [
        { name: 'Long Term Bank Borrowings', amount: 450000 }
      ]},
      { category: 'Current Liabilities', items: [
        { name: 'Trade Payables (Creditors)', amount: 220000 },
        { name: 'GST & Statutory Tax Payables', amount: 90000 }
      ]}
    ]
  };

  // Mock Trial Balance Data
  const tbData = [
    { code: '1001', name: 'Equity Share Capital', type: 'Equity', debit: 0, credit: 2000000 },
    { code: '1205', name: 'Retained Earnings', type: 'Reserves', debit: 0, credit: 1680000 },
    { code: '2001', name: 'HDFC Bank Term Loan', type: 'Long-term Liability', debit: 0, credit: 450000 },
    { code: '3110', name: 'HDFC Current A/c', type: 'Asset', debit: 1280000, credit: 0 },
    { code: '4005', name: 'Office Furniture & Fixtures', type: 'Asset', debit: 1850000, credit: 0 },
    { code: '5020', name: 'Trade Receivables (A/R)', type: 'Asset', debit: 620000, credit: 0 },
    { code: '5050', name: 'Trade Payables (A/P)', type: 'Liability', debit: 0, credit: 220000 },
    { code: '6001', name: 'Sales Revenue', type: 'Income', debit: 0, credit: 3460000 },
    { code: '7005', name: 'Direct Purchase Costs', type: 'Expense', debit: 1120000, credit: 0 },
    { code: '7210', name: 'Salaries & Wages Expense', type: 'Expense', debit: 680000, credit: 0 },
    { code: '7230', name: 'Office Rent & Utility Fees', type: 'Expense', debit: 150000, credit: 0 },
    { code: '7250', name: 'Advertising & Marketing', type: 'Expense', debit: 180000, credit: 0 },
    { code: '7280', name: 'Professional Tax & Legal A/c', type: 'Expense', debit: 75000, credit: 0 },
    { code: '7300', name: 'Depreciation Reserve', type: 'Expense', debit: 45000, credit: 0 },
    { code: '8115', name: 'GST Output Payable', type: 'Liability', debit: 0, credit: 90000 },
  ];

  // Helper calculations
  const totalRevenue = plData.revenue.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = plData.expenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const totalAssets = bsData.assets.reduce((sum, cat) => sum + cat.items.reduce((s, i) => s + i.amount, 0), 0);
  const totalLiabilities = bsData.liabilities.reduce((sum, cat) => sum + cat.items.reduce((s, i) => s + i.amount, 0), 0);

  const tbTotalDebit = tbData.reduce((sum, item) => sum + item.debit, 0);
  const tbTotalCredit = tbData.reduce((sum, item) => sum + item.credit, 0);

  return (
    <div className="page-transition space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Financial Statements & Audit Ledgers</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Generate, audit, and analyze statement accounts for dynamic financial reporting.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="h-9 border border-[#E5E7EB] text-slate-700 bg-white hover:bg-slate-50 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print Statement
          </button>
          <button className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-900/10">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" /> Export Excel
          </button>
        </div>
      </div>

      {/* Switcher Tab Buttons */}
      <div className="flex bg-[#F8FAFC] p-1 border border-[#E5E7EB] rounded-lg w-fit">
        {[
          { id: 'pl', label: 'Profit & Loss' },
          { id: 'bs', label: 'Balance Sheet' },
          { id: 'tb', label: 'Trial Balance' },
          { id: 'cf', label: 'Cash Flow' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-emerald-600 border border-[#E5E7EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm p-6 space-y-6">
        
        {activeTab === 'pl' && (
          <div className="space-y-6">
            <div className="border-b border-[#F1F5F9] pb-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Statement of Profit & Loss</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">For the financial year ended March 31, 2026</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Unaudited Draft</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Income */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">I. Revenue & Income</h4>
                <div className="divide-y divide-[#F1F5F9] border-t border-[#E5E7EB]">
                  {plData.revenue.map((item, index) => (
                    <div key={index} className="flex justify-between py-2 text-xs font-medium text-slate-700">
                      <span>{item.name}</span>
                      <span>₹{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2.5 text-xs font-bold text-[#0f172a] bg-slate-50 px-2 rounded mt-1 border-t border-slate-300">
                    <span>Total Revenue (A)</span>
                    <span>₹{totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">II. Expenses</h4>
                <div className="divide-y divide-[#F1F5F9] border-t border-[#E5E7EB]">
                  {plData.expenses.map((item, index) => (
                    <div key={index} className="flex justify-between py-2 text-xs font-medium text-slate-700">
                      <span>{item.name}</span>
                      <span>₹{item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2.5 text-xs font-bold text-[#0f172a] bg-slate-50 px-2 rounded mt-1 border-t border-slate-300">
                    <span>Total Expenses (B)</span>
                    <span>₹{totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div className="bg-emerald-50/50 border border-emerald-200/60 p-4 rounded-xl flex justify-between items-center mt-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Net Income / Profit (A - B)</p>
                  <p className="text-[9px] text-emerald-600/80">Retained for shareholder reserves</p>
                </div>
                <p className="text-xl font-bold text-emerald-700">₹{netProfit.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bs' && (
          <div className="space-y-6">
            <div className="border-b border-[#F1F5F9] pb-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Balance Sheet</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">As of March 31, 2026</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Balanced</span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Assets */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider border-b-2 border-emerald-500 pb-1.5">Assets</h4>
                {bsData.assets.map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{cat.category}</h5>
                    <div className="divide-y divide-[#F1F5F9] border-t border-slate-100">
                      {cat.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between py-2 text-xs font-medium text-slate-700">
                          <span>{item.name}</span>
                          <span>₹{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between py-2.5 text-xs font-bold text-slate-900 bg-slate-50 px-3 rounded border-t border-slate-300">
                  <span>Total Assets</span>
                  <span>₹{totalAssets.toLocaleString()}</span>
                </div>
              </div>

              {/* Liabilities */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b-2 border-slate-500 pb-1.5">Liabilities & Equity</h4>
                {bsData.liabilities.map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{cat.category}</h5>
                    <div className="divide-y divide-[#F1F5F9] border-t border-slate-100">
                      {cat.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between py-2 text-xs font-medium text-slate-700">
                          <span>{item.name}</span>
                          <span>₹{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between py-2.5 text-xs font-bold text-slate-900 bg-slate-50 px-3 rounded border-t border-slate-300">
                  <span>Total Equity & Liabilities</span>
                  <span>₹{totalLiabilities.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tb' && (
          <div className="space-y-4">
            <div className="border-b border-[#F1F5F9] pb-4">
              <h3 className="font-bold text-slate-900 text-sm">Trial Balance Summary</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">List of debit & credit balances as of March 31, 2026</p>
            </div>

            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[10px] font-bold text-[#64748B] uppercase tracking-wider h-10">
                    <th className="p-3 w-16">Acct Code</th>
                    <th className="p-3">Ledger Name</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3 text-right">Debit Balance</th>
                    <th className="p-3 text-right">Credit Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {tbData.map((item) => (
                    <tr key={item.code} className="h-10 hover:bg-[#F8FAFC] transition">
                      <td className="p-3 font-mono text-[#64748B]">{item.code}</td>
                      <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="p-3 text-slate-500">{item.type}</td>
                      <td className="p-3 text-right font-medium text-slate-800">
                        {item.debit > 0 ? `₹${item.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-right font-medium text-slate-800">
                        {item.credit > 0 ? `₹${item.credit.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="h-11 bg-slate-50/80 font-bold border-t border-slate-300">
                    <td className="p-3" colSpan={3}>Aggregate Balances</td>
                    <td className="p-3 text-right text-slate-900">₹{tbTotalDebit.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-900">₹{tbTotalCredit.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'cf' && (
          <div className="space-y-6">
            <div className="border-b border-[#F1F5F9] pb-4">
              <h3 className="font-bold text-slate-900 text-sm">Statement of Cash Flows</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Operating, investing and financing logs</p>
            </div>

            <div className="divide-y divide-[#F1F5F9] border-t border-[#E5E7EB]">
              <div className="py-3 flex justify-between text-xs font-semibold text-slate-800">
                <span>Net Cash from Operating Activities (A)</span>
                <span>₹1,450,000</span>
              </div>
              <div className="py-3 flex justify-between text-xs font-semibold text-slate-800">
                <span>Net Cash used in Investing Activities (B)</span>
                <span className="text-rose-600">-₹600,000</span>
              </div>
              <div className="py-3 flex justify-between text-xs font-semibold text-slate-800">
                <span>Net Cash from Financing Activities (C)</span>
                <span>₹430,000</span>
              </div>
              <div className="py-4 flex justify-between text-xs font-bold text-emerald-800 bg-emerald-50 px-3 rounded-lg border-t border-emerald-200 mt-2">
                <span>Net Cash Increase (A + B + C)</span>
                <span>₹1,280,000</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FinancialStatements;
