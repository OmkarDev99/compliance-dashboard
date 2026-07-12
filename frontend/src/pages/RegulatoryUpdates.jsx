import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ExternalLink, FileText, Search, ShieldCheck } from 'lucide-react';
import { getRegulatoryUpdates } from '../services/regulatory';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const RegulatoryUpdates = () => {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['regulatory-updates', submittedSearch, source],
    queryFn: () => getRegulatoryUpdates({ query: submittedSearch, source, limit: 60 }),
  });

  const submitSearch = (event) => {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  };

  return (
    <div className="page-transition space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#2563EB] text-[10px] font-bold uppercase tracking-[0.18em] mb-2">
            <ShieldCheck className="w-4 h-4" /> Verified source library
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Regulatory intelligence</h1>
          <p className="text-xs text-[#64748B] mt-1 max-w-2xl">Search the collected MCA, ICSI, RBI and Vayana regulatory material used by the compliance team. Open the original source before relying on an update for a filing decision.</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-lg px-4 py-3 min-w-[220px]">
          <p className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold">Available records</p>
          <p className="text-2xl font-mono font-bold text-[#0F172A] mt-1">{data?.total ?? '—'}</p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm">
        <form onSubmit={submitSearch} className="flex flex-col md:flex-row gap-3">
          <label className="flex-1 h-10 flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg px-3 focus-within:border-[#2563EB]">
            <Search className="w-4 h-4 text-[#64748B]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search forms, circulars, penalties or keywords..." className="w-full bg-transparent text-xs" />
          </label>
          <select value={source} onChange={(event) => setSource(event.target.value)} className="h-10 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg px-3 text-xs text-[#0F172A] min-w-[180px]">
            <option value="">All sources</option>
            {data?.sources?.map((item) => <option key={item.source} value={item.source}>{item.source} ({item.count})</option>)}
          </select>
          <button type="submit" className="h-10 px-5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold">Search library</button>
        </form>
      </div>

      {isLoading ? <Loader /> : data?.items?.length ? (
        <div className="grid gap-3">
          {data.items.map((item) => (
            <article key={item.id} className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#BFDBFE] hover:shadow-sm transition-all">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="px-2 py-1 bg-[#EFF6FF] text-[#2563EB] rounded">{item.source}</span>
                    <span className="text-[#64748B]">{item.category}</span>
                    {item.publication_date && <span className="text-[#94A3B8] font-mono">{item.publication_date}</span>}
                  </div>
                  <h2 className="text-sm font-bold text-[#0F172A] leading-5">{item.title}</h2>
                  <p className="mt-2 text-xs leading-5 text-[#64748B]">{item.summary || 'Open the original record for complete details.'}</p>
                  {item.keywords?.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{item.keywords.slice(0, 6).map((keyword) => <span key={keyword} className="px-2 py-1 rounded bg-[#F8FAFC] border border-[#E5E7EB] text-[9px] text-[#64748B]">{keyword}</span>)}</div>}
                </div>
                <a href={item.url} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]">Open source <ExternalLink className="w-3.5 h-3.5" /></a>
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyState icon={BookOpen} title="No regulatory records found" description="Try a broader keyword or select another source." />}

      <div className="flex items-start gap-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] p-4 text-xs text-[#92400E]">
        <FileText className="w-4 h-4 mt-0.5 shrink-0" />
        <p><strong>Compliance note:</strong> This library is a research aid built from scraped public material. Always confirm filing dates, fees and legal applicability against the linked official publication.</p>
      </div>
    </div>
  );
};

export default RegulatoryUpdates;
