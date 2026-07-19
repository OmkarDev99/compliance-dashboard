import React, { useState } from 'react';
import { RefreshCw, Upload, AlertCircle, CheckCircle2, AlertTriangle, FileText, ArrowUpRight, Search } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const Reconciliation = () => {
  const { isCS } = useWorkspace();
  const [activeSubTab, setActiveSubTab] = useState('gst'); // 'gst' or 'bank'
  const [searchQuery, setSearchQuery] = useState('');
  const [isReconciling, setIsReconciling] = useState(false);

  // Mock data for GSTR-2B mismatch detection
  const [mismatches, setMismatches] = useState([
    { id: 1, vendor: 'Alpha Trading Corp', invoiceNo: 'INV/2026/012', date: '2026-06-10', internalAmount: 45000, portalAmount: 45000, internalIitc: 8100, portalIitc: 8100, status: 'matched' },
    { id: 2, vendor: 'Beta Marketing Solutions', invoiceNo: 'BMS-8891', date: '2026-06-12', internalAmount: 120000, portalAmount: 110000, internalIitc: 21600, portalIitc: 19800, status: 'mismatch' },
    { id: 3, vendor: 'Gamma Infrastructure', invoiceNo: 'INFRA-991', date: '2026-06-15', internalAmount: 350000, portalAmount: 0, internalIitc: 63000, portalIitc: 0, status: 'missing' },
    { id: 4, vendor: 'Delta Consulting Group', invoiceNo: 'DCG/Q1/03', date: '2026-06-18', internalAmount: 85000, portalAmount: 85000, internalIitc: 15300, portalIitc: 15300, status: 'matched' },
    { id: 5, vendor: 'Epsilon Tech Systems', invoiceNo: 'ETS/JUN/44', date: '2026-06-20', internalAmount: 18000, portalAmount: 20000, internalIitc: 3240, portalIitc: 3600, status: 'mismatch' },
  ]);

  // Mock bank records
  const [bankRecords, setBankRecords] = useState([
    { id: 101, refNo: 'TXN-9988221', date: '2026-06-11', bankDesc: 'UPI-ALPHA TRADING CORP-882@okaxis', debit: 0, credit: 45000, status: 'matched', matchedInvoice: 'INV/2026/012' },
    { id: 102, refNo: 'TXN-9988224', date: '2026-06-13', bankDesc: 'NEFT-BETA MARKETING SOLUTIONS', debit: 0, credit: 110000, status: 'partial_match', matchedInvoice: 'BMS-8891 (Partial)' },
    { id: 103, refNo: 'TXN-9988229', date: '2026-06-19', bankDesc: 'CHQ-DEPOS-DELTA CONSULTING', debit: 0, credit: 85000, status: 'matched', matchedInvoice: 'DCG/Q1/03' },
    { id: 104, refNo: 'TXN-9988235', date: '2026-06-22', bankDesc: 'ATM-WDL-MUMBAI BRANCH', debit: 20000, credit: 0, status: 'unmatched', matchedInvoice: '-' },
  ]);

  const runReconciliation = () => {
    setIsReconciling(true);
    setTimeout(() => {
      setIsReconciling(false);
      alert('Reconciliation run complete! Input Tax Credit updated.');
    }, 1500);
  };

  const filteredMismatches = mismatches.filter(item => 
    item.vendor.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-transition space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Invoice & Bank Reconciliation</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Detect input tax credit mismatches, reconcile purchase books, and audit bank statements.</p>
        </div>
        <button
          onClick={runReconciliation}
          disabled={isReconciling}
          className="h-9 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-md shrink-0 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isReconciling ? 'animate-spin' : ''}`} />
          {isReconciling ? 'Reconciling Ledger...' : 'Run Auto Matcher'}
        </button>
      </div>

      {/* Switch Tabs */}
      <div className="border-b border-[#E5E7EB] flex gap-6">
        <button 
          onClick={() => { setActiveSubTab('gst'); setSearchQuery(''); }}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
            activeSubTab === 'gst' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          GST GSTR-2B Rec (ITC)
        </button>
        <button 
          onClick={() => { setActiveSubTab('bank'); setSearchQuery(''); }}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
            activeSubTab === 'bank' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          Bank Statement Rec
        </button>
      </div>

      {activeSubTab === 'gst' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          {/* Main Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-sm">
              <div className="flex items-center bg-[#F8FAFC] border border-[#E5E7EB] rounded-md px-3 py-1.5 text-xs w-full max-w-xs focus-within:border-emerald-600 transition-colors">
                <Search className="w-4 h-4 text-[#64748B] mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by vendor or invoice number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-[#0F172A] placeholder-[#94A3B8] outline-none text-xs w-full"
                />
              </div>

              <span className="text-[10px] font-medium text-[#64748B]">
                Showing {filteredMismatches.length} invoice records
              </span>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[10px] font-bold text-[#64748B] uppercase tracking-wider h-11">
                      <th className="p-4">Vendor Details</th>
                      <th className="p-4">Invoice #</th>
                      <th className="p-4 text-right">Internal (ITC)</th>
                      <th className="p-4 text-right">GSTR-2B (ITC)</th>
                      <th className="p-4 text-right">Variance</th>
                      <th className="p-4 text-center">Rec Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredMismatches.map((item) => {
                      const variance = item.internalAmount - item.portalAmount;
                      const itcVariance = item.internalIitc - item.portalIitc;
                      return (
                        <tr key={item.id} className="h-12 hover:bg-[#F8FAFC] transition-all">
                          <td className="p-4 font-semibold text-[#0F172A]">
                            {item.vendor}
                          </td>
                          <td className="p-4 font-mono text-[#64748B]">
                            {item.invoiceNo}
                          </td>
                          <td className="p-4 text-right font-medium text-slate-800">
                            ₹{item.internalAmount.toLocaleString()} <span className="block text-[9px] text-slate-400">ITC: ₹{item.internalIitc.toLocaleString()}</span>
                          </td>
                          <td className="p-4 text-right font-medium text-slate-800">
                            ₹{item.portalAmount.toLocaleString()} <span className="block text-[9px] text-slate-400">ITC: ₹{item.portalIitc.toLocaleString()}</span>
                          </td>
                          <td className={`p-4 text-right font-semibold ${variance === 0 ? 'text-slate-500' : 'text-rose-600'}`}>
                            {variance === 0 ? '₹0' : `₹${variance.toLocaleString()}`}
                            {itcVariance !== 0 && <span className="block text-[9px] font-medium text-rose-500">ITC diff: ₹{itcVariance.toLocaleString()}</span>}
                          </td>
                          <td className="p-4 text-center">
                            {item.status === 'matched' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-600 uppercase">
                                <CheckCircle2 className="w-3 h-3" /> Matched
                              </span>
                            )}
                            {item.status === 'mismatch' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-600 uppercase">
                                <AlertTriangle className="w-3 h-3" /> Mismatch
                              </span>
                            )}
                            {item.status === 'missing' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-600 uppercase">
                                <AlertCircle className="w-3 h-3" /> Missing
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Upload */}
          <div className="space-y-5">
            <div className="premium-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                <Upload className="w-4 h-4 text-emerald-600" />
                Upload Purchase Register
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">Import purchase books (Tally Excel or CSV) to auto-match against scraped GSTR-2B portal entries.</p>
              
              <div className="border border-dashed border-[#E5E7EB] hover:border-emerald-500 transition rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer">
                <FileText className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-[10px] font-semibold text-slate-700">Drag & drop files here</span>
                <span className="text-[9px] text-slate-400 mt-0.5">XLSX, CSV up to 10MB</span>
              </div>
            </div>

            <div className="premium-card p-5 space-y-3 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-none shadow-md shadow-emerald-950/20">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Reconciliation Summary</p>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-[9px] text-emerald-100 uppercase">Total ITC claimed</p>
                  <p className="text-lg font-bold">₹1,03,240</p>
                </div>
                <div>
                  <p className="text-[9px] text-emerald-100 uppercase">Portal Mismatches</p>
                  <p className="text-lg font-bold text-rose-200">₹64,800</p>
                </div>
              </div>
              <div className="h-px bg-white/10 my-1" />
              <p className="text-[9px] text-emerald-100/80 leading-relaxed">We found 2 mismatches and 1 missing entry. Make sure vendors have loaded their GSTR-1 before filing your GSTR-3B.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <h3 className="text-slate-900 font-semibold text-xs">Bank Statement Auditor</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Reconcile transaction ledger credits against invoice registers.</p>
              </div>
              <div className="flex gap-2">
                <button className="h-8 border border-[#E5E7EB] text-slate-700 bg-white hover:bg-slate-50 px-3 rounded text-[10px] font-semibold flex items-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5 text-slate-500" /> Upload Bank Statement
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[10px] font-bold text-[#64748B] uppercase tracking-wider h-11">
                    <th className="p-4">Transaction Ref</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Debit</th>
                    <th className="p-4 text-right">Credit</th>
                    <th className="p-4">Matched Obligation / Invoice</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {bankRecords.map((rec) => (
                    <tr key={rec.id} className="h-12 hover:bg-[#F8FAFC] transition">
                      <td className="p-4 font-mono text-[#64748B]">
                        {rec.refNo}
                      </td>
                      <td className="p-4 text-slate-600">
                        {rec.date}
                      </td>
                      <td className="p-4 font-semibold text-[#0F172A]">
                        {rec.bankDesc}
                      </td>
                      <td className="p-4 text-right font-medium text-[#EF4444]">
                        {rec.debit > 0 ? `₹${rec.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-4 text-right font-medium text-[#22C55E]">
                        {rec.credit > 0 ? `₹${rec.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-4 text-[#0F172A] font-semibold">
                        {rec.matchedInvoice}
                      </td>
                      <td className="p-4 text-center">
                        {rec.status === 'matched' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-600 uppercase">
                            Matched
                          </span>
                        )}
                        {rec.status === 'partial_match' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-600 uppercase">
                            Partial Match
                          </span>
                        )}
                        {rec.status === 'unmatched' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-600 uppercase">
                            Unmatched
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reconciliation;
