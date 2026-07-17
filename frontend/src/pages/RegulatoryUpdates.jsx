import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, FileText, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { getRegulatoryUpdates } from '../services/regulatory';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const PAGE_SIZE = 24;

const RegulatoryUpdates = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['regulatory-updates', query, source, page],
    queryFn: () => getRegulatoryUpdates({ query, source, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    placeholderData: (previous) => previous,
  });

  const submit = (event) => {
    event.preventDefault();
    setPage(0);
    setQuery(search.trim());
  };
  const selectSource = (value) => { setSource(value); setPage(0); };
  const lastPage = Math.max(0, Math.ceil((data?.total || 0) / PAGE_SIZE) - 1);
  const start = data?.total ? page * PAGE_SIZE + 1 : 0;
  const end = Math.min((page + 1) * PAGE_SIZE, data?.total || 0);

  return (
    <div className="page-transition space-y-6">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600"><ShieldCheck className="h-3.5 w-3.5" /> Source-backed research</div>
          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-[30px]">Regulatory intelligence, without the noise.</h1>
          <p className="mt-2 text-xs leading-5 text-slate-500">Search circulars, directions, codes and notices collected across India’s key regulatory and business-registration sources.</p>
        </div>
        <div className="premium-card min-w-[210px] p-4"><p className="eyebrow">Matching records</p><div className="mt-2 flex items-end justify-between"><p className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">{(data?.total ?? 0).toLocaleString()}</p><p className="pb-1 text-[9px] text-slate-400">{data?.sources?.length || 0} sources indexed</p></div></div>
      </section>

      <section className="premium-card p-4 sm:p-5">
        <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
          <label className="flex h-11 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search form names, regulations, circulars or keywords" className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400" />
          </label>
          <button type="submit" className="premium-button-primary h-11 px-5"><Search className="h-3.5 w-3.5" /> Search intelligence</button>
        </form>

        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          <SlidersHorizontal className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <button onClick={() => selectSource('')} className={`source-chip ${source === '' ? 'source-chip-active' : ''}`}>All sources</button>
          {data?.sources?.map((item) => <button key={item.source} onClick={() => selectSource(item.source)} className={`source-chip ${source === item.source ? 'source-chip-active' : ''}`}>{item.source}<span>{item.count.toLocaleString()}</span></button>)}
        </div>
      </section>

      {isLoading ? <Loader /> : data?.items?.length ? (
        <>
          <div className={`grid gap-3 lg:grid-cols-2 ${isFetching ? 'opacity-60' : ''}`}>
            {data.items.map((item) => (
              <article key={item.id} className="premium-card group flex min-h-[190px] flex-col p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_45px_rgba(16,24,40,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700">{item.source}</span><span className="text-[9px] font-medium uppercase tracking-wider text-slate-400">{item.category || item.document_type}</span></div>
                  <FileText className="h-4 w-4 shrink-0 text-slate-300" />
                </div>
                <h2 className="mt-4 line-clamp-2 text-[13px] font-semibold leading-5 text-slate-950">{item.title}</h2>
                <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-slate-500">{item.summary || 'Open the original publication for complete details.'}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <p className="text-[9px] text-slate-400">{item.publication_date || item.document_type}</p>
                  <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 transition hover:text-blue-800">Open publication <ExternalLink className="h-3 w-3" /></a>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 sm:flex-row">
            <p className="text-[10px] text-slate-500">Showing {start.toLocaleString()}–{end.toLocaleString()} of {(data.total || 0).toLocaleString()}</p>
            <div className="flex items-center gap-2"><button disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="pagination-button"><ArrowLeft className="h-3.5 w-3.5" /> Previous</button><span className="px-2 text-[10px] font-medium text-slate-500">Page {page + 1} of {lastPage + 1}</span><button disabled={page >= lastPage} onClick={() => setPage((value) => value + 1)} className="pagination-button">Next <ArrowRight className="h-3.5 w-3.5" /></button></div>
          </div>
        </>
      ) : <EmptyState icon={BookOpen} title="No regulatory records found" description="Try a broader keyword or choose another source." />}

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 text-[11px] leading-5 text-amber-900"><FileText className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>Research aid:</strong> confirm deadlines, fees and legal applicability against the linked official publication before making a filing decision.</p></div>
    </div>
  );
};

export default RegulatoryUpdates;
