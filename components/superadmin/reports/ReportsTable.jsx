"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/core/utils/supabase/client";
import { MdCheck, MdClose, MdOpenInNew } from "react-icons/md";
import { toast } from "sonner";
import Link from "next/link";

export default function ReportsTable() {
  const supabase = useMemo(() => createClient(), []);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filter, supabase]);

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);
        
      if (error) throw error;
      
      toast.success(`Report marked as ${newStatus}`);
      fetchReports();
    } catch (error) {
      console.error("Error updating report status:", error);
      toast.error("Failed to update report status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'reviewed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'dismissed': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[800px]">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
           <h2 className="text-lg font-bold font-spaceGrotesk text-slate-900">Moderation Queue</h2>
           <p className="text-sm text-slate-500">Review user-submitted reports</p>
        </div>
        
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          {['pending', 'resolved', 'dismissed', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
              <th className="py-4 px-6">Reported Item</th>
              <th className="py-4 px-6">Reporter</th>
              <th className="py-4 px-6">Reason</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">Loading reports...</td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">No reports found for this filter.</td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-900 capitalize flex items-center gap-2">
                       {report.reported_item_type}
                       <Link 
                         href={
                           report.reported_item_type === 'user'
                             ? `/users/${report.reported_item_id}`
                             : report.reported_item_type === 'property'
                               ? `/listings/${report.reported_item_id}`
                               : '#'
                         }
                         target="_blank"
                         onClick={(e) => {
                           if (report.reported_item_type === 'message') {
                             e.preventDefault();
                             toast.error('Direct message preview is not available yet.');
                           }
                         }}
                         className="text-slate-400 hover:text-primary transition-colors inline-flex"
                         title="View Reported Item"
                       >
                         <MdOpenInNew size={16} />
                       </Link>
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5 font-mono truncate max-w-[150px]" title={report.reported_item_id}>
                       ID: {report.reported_item_id.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="py-4 px-6">
                     <div className="font-medium text-slate-900 truncate max-w-[150px]">{report.reporter?.full_name || 'Unknown'}</div>
                     <div className="text-slate-500 text-xs truncate max-w-[150px]">{report.reporter?.email}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-slate-700 max-w-[250px] line-clamp-2" title={report.reason}>
                      {report.reason}
                    </div>
                    <div className="text-slate-400 text-xs mt-1">
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      {report.status !== 'resolved' && (
                        <button 
                          onClick={() => updateReportStatus(report.id, 'resolved')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                          title="Mark Resolved"
                        >
                          <MdCheck size={18} />
                        </button>
                      )}
                      
                      {report.status !== 'dismissed' && (
                        <button 
                          onClick={() => updateReportStatus(report.id, 'dismissed')}
                          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                          title="Dismiss Report"
                        >
                          <MdClose size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
