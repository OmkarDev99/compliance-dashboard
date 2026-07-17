import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import ChatBox from '../components/ChatBox';
import { checkChatHealth } from '../services/chat';

const Chat = () => {
  const [status, setStatus] = useState('checking');
  const [recordCount, setRecordCount] = useState(0);

  const check = async () => {
    setStatus('checking');
    try {
      const result = await checkChatHealth();
      setRecordCount(result.records_indexed || 0);
      setStatus('ready');
    } catch {
      setStatus('unavailable');
    }
  };

  useEffect(() => { check(); }, []);

  if (status === 'checking') {
    return <div className="premium-card flex min-h-[520px] items-center justify-center"><div className="text-center"><RefreshCw className="mx-auto h-5 w-5 animate-spin text-blue-600" /><p className="mt-3 text-xs text-slate-500">Preparing regulatory assistant…</p></div></div>;
  }

  if (status === 'unavailable') {
    return <div className="premium-card flex min-h-[520px] items-center justify-center p-8"><div className="max-w-sm text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><RefreshCw className="h-5 w-5" /></div><h2 className="mt-4 text-base font-semibold text-slate-950">Assistant is reconnecting</h2><p className="mt-2 text-xs leading-5 text-slate-500">The regulatory library could not be reached. The rest of the dashboard remains available.</p><button onClick={check} className="premium-button-primary mt-5 h-10 px-4"><RefreshCw className="h-3.5 w-3.5" /> Try again</button></div></div>;
  }

  return (
    <div className="page-transition space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl"><div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600"><ShieldCheck className="h-3.5 w-3.5" /> Source-backed assistant</div><h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-950">Ask the regulatory library.</h1><p className="mt-2 text-xs leading-5 text-slate-500">Find relevant publications and excerpts across the indexed compliance sources. Answers always include links to the original material.</p></div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> {recordCount.toLocaleString()} records ready</div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <div className="h-[620px]"><ChatBox /></div>
        <aside className="space-y-4">
          <div className="premium-card p-5"><Search className="h-4 w-4 text-blue-600" /><p className="mt-4 text-xs font-semibold text-slate-900">Ask focused questions</p><ul className="mt-3 space-y-2 text-[10px] leading-4 text-slate-500"><li>Include a form or circular number</li><li>Name the relevant regulator</li><li>Mention the filing or obligation</li><li>Use one question at a time</li></ul></div>
          <div className="premium-card p-5"><BookOpen className="h-4 w-4 text-violet-600" /><p className="mt-4 text-xs font-semibold text-slate-900">Example searches</p><ul className="mt-3 space-y-2 text-[10px] leading-4 text-slate-500"><li>“MCA annual filing requirements”</li><li>“SEBI disclosure circular”</li><li>“IBBI insolvency regulations”</li><li>“Udyam registration guidance”</li></ul></div>
        </aside>
      </section>
    </div>
  );
};

export default Chat;
