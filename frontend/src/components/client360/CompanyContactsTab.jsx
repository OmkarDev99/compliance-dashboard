import React from 'react';
import EmptyState from '../EmptyState';

const CompanyContactsTab = ({ contacts }) => contacts.length === 0 ? <EmptyState title="No company contacts recorded" description="Directors and key personnel can be shown here once contact records are available." /> : (
  <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]"><table className="min-w-full text-left text-xs"><thead className="bg-[#F8FAFC] text-[10px] uppercase tracking-wider text-[#64748B]"><tr><th className="p-3">Name</th><th className="p-3">Designation</th><th className="p-3">DIN / PAN</th><th className="p-3">Email</th><th className="p-3">Phone</th></tr></thead><tbody>{contacts.map((contact) => <tr key={contact.id} className="border-t border-[#E5E7EB]"><td className="p-3 font-semibold">{contact.name}</td><td className="p-3">{contact.designation}</td><td className="p-3">{contact.din_pan || '-'}</td><td className="p-3">{contact.email || '-'}</td><td className="p-3">{contact.phone_number || '-'}</td></tr>)}</tbody></table></div>
);

export default CompanyContactsTab;
