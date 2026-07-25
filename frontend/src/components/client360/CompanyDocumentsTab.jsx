import React from 'react';
import { Download } from 'lucide-react';
import EmptyState from '../EmptyState';
import { formatDate } from '../../utils/dateUtils';

const CompanyDocumentsTab = ({ documents }) => documents.length === 0 ? <EmptyState title="No client documents available" description="Reference documents attached to compliance tasks will appear here." /> : (
  <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]"><table className="min-w-full text-left text-xs"><thead className="bg-[#F8FAFC] text-[10px] uppercase tracking-wider text-[#64748B]"><tr><th className="p-3">Document</th><th className="p-3">Category</th><th className="p-3">Uploaded</th><th className="p-3">File size</th><th className="p-3">Download</th></tr></thead><tbody>{documents.map((document) => <tr key={document.id} className="border-t border-[#E5E7EB]"><td className="p-3 font-semibold text-[#0F172A]">{document.title}</td><td className="p-3 text-[#475569]">{document.category}</td><td className="p-3 text-[#475569]">{formatDate(document.uploaded_at)}</td><td className="p-3 text-[#475569]">Not available</td><td className="p-3"><a href={document.download_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2563EB] hover:underline"><Download className="h-3.5 w-3.5" />Download</a></td></tr>)}</tbody></table></div>
);

export default CompanyDocumentsTab;
