'use client';

import { MdCheckCircle, MdCancel, MdWarning } from 'react-icons/md';
import Link from 'next/link';

export default function ComparisonSection() {
  const features = [
    { label: "Compatibility Matching", daft: false, fb: false, roomly: true, sub: "(6 factors)" },
    { label: "Profile Verification", daft: false, fb: false, roomly: true, sub: "(Email, phone, opt. ID)" },
    { label: "Privacy Control", daft: false, fb: false, roomly: true, sub: "(Public or private)" },
    { label: "Message Quality", daft: false, fb: false, roomly: true, sub: "(High-match only)" },
    { label: "Built-in Messaging", daft: false, fb: false, roomly: true, sub: "(Secure)" },
    { label: "Mobile Experience", daft: "warn", fb: "warn", roomly: true, sub: "(Mobile-first)" },
    { label: "Price", daft: "€50-100 to list", fb: "Free", roomly: "100% Free", isText: true },
  ];

  const renderIcon = (status) => {
    if (status === true) return <MdCheckCircle className="text-emerald-500 text-2xl mx-auto" />;
    if (status === false) return <MdCancel className="text-slate-300 text-2xl mx-auto" />;
    if (status === "warn") return <MdWarning className="text-amber-500 text-2xl mx-auto" />;
    return <span className="font-bold text-navy-950 text-sm md:text-base">{status}</span>;
  };

  return (
    <section className="py-20 lg:py-32 bg-slate-50">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-950 mb-4">
                Why Roomly Beats Traditional Platforms
            </h2>
            <p className="text-lg text-slate-600">
                See how we stack up against Daft, Rent.ie, and Facebook groups
            </p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden max-w-5xl mx-auto">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-6 text-left text-slate-500 font-medium w-1/4"></th>
                            <th className="p-6 text-center text-slate-500 font-bold w-1/4">DAFT / RENT.IE</th>
                            <th className="p-6 text-center text-slate-500 font-bold w-1/4">FACEBOOK GROUPS</th>
                            <th className="p-6 text-center bg-terracotta-50 text-terracotta-600 font-extrabold w-1/4 rounded-t-2xl relative">
                                ROOMLY
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    WINNER
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {features.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="p-6 text-sm md:text-base font-bold text-navy-950">
                                    {row.label}
                                    {row.sub && !row.isText && <span className="block text-xs font-normal text-slate-400 mt-1">{row.sub}</span>}
                                </td>
                                <td className="p-6 text-center">
                                    {renderIcon(row.daft)}
                                    {row.daft === false && <div className="text-[10px] text-slate-400 mt-1">None</div>}
                                    {row.daft === "warn" && <div className="text-[10px] text-slate-400 mt-1">Clunky</div>}
                                </td>
                                <td className="p-6 text-center">
                                    {renderIcon(row.fb)}
                                    {row.fb === false && <div className="text-[10px] text-slate-400 mt-1">None (Spam)</div>}
                                    {row.fb === "warn" && <div className="text-[10px] text-slate-400 mt-1">Difficult Search</div>}
                                </td>
                                <td className="p-6 text-center bg-terracotta-50/30">
                                    {renderIcon(row.roomly)}
                                    {row.roomly === true && row.sub && !features.find(f => f.label === row.label).isText && (
                                        <div className="text-[10px] text-emerald-600 font-medium mt-1">Yes</div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="p-8 text-center bg-slate-50 border-t border-slate-200">
                <Link 
                    href="/signup" 
                    className="inline-flex bg-terracotta-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-terracotta-600 transition-all shadow-lg shadow-terracotta-500/20"
                >
                    Find Your Match on Roomly →
                </Link>
            </div>
        </div>

      </div>
    </section>
  );
}
