"use client";

import { useState, useEffect } from "react";
import { MdSearch, MdBlock, MdCheckCircle, MdHomeWork, MdVisibility } from "react-icons/md";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

export default function PropertiesTable() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search.trim()) params.set('q', search.trim());

      const response = await fetch(`/api/superadmin/properties?${params.toString()}`, {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load properties');
      }

      setProperties(payload.properties || []);
      setTotal(payload.total || 0);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error(error?.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProperties();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const togglePropertyStatus = async (propertyId, currentStatus) => {
    try {
      const response = await fetch(`/api/superadmin/properties/${propertyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update property status');
      }
      
      toast.success(`Property is now ${!currentStatus ? 'Active' : 'Suspended'}`);
      fetchProperties();
    } catch (error) {
      console.error("Error updating property status:", error);
      toast.error(error?.message || "Failed to update property status");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[800px]">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
           <h2 className="text-lg font-bold font-spaceGrotesk text-slate-900">Properties</h2>
           <p className="text-sm text-slate-500">Manage all property listings</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by title or location..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
              <th className="py-4 px-6">Property</th>
              <th className="py-4 px-6">Lister</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Price</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">Loading properties...</td>
              </tr>
            ) : properties.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">No properties found.</td>
              </tr>
            ) : (
              properties.map((property) => {
                let primaryImage = property.property_media?.find(m => m.is_primary)?.url || property.property_media?.[0]?.url;
                
                if (primaryImage && !primaryImage.startsWith('http')) {
                  primaryImage = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${primaryImage}`;
                }
                
                return (
                  <tr key={property.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                          {primaryImage ? (
                            <Image src={primaryImage} alt={property.title} width={48} height={40} className="object-cover w-full h-full" />
                          ) : (
                            <MdHomeWork className="text-slate-400" size={20} />
                          )}
                        </div>
                        <div className="min-w-0">
                           <div className="font-medium text-slate-900 truncate max-w-[250px]">{property.title}</div>
                           <div className="text-slate-500 text-xs truncate max-w-[250px]">{property.street}, {property.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                       <div className="font-medium text-slate-900 truncate max-w-[150px]">{property.users?.full_name || 'Unknown'}</div>
                       <div className="text-slate-500 text-xs truncate max-w-[150px]">{property.users?.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                        ${property.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {property.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900">
                      €{property.price_per_month}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                         <Link 
                           href={`/listings/${property.id}`}
                           target="_blank"
                           className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                           title="View Listing"
                         >
                           <MdVisibility size={18} />
                         </Link>
                         <button 
                           onClick={() => togglePropertyStatus(property.id, property.is_active)}
                           className={`p-2 rounded-lg transition-colors border ${
                             property.is_active ? 'text-red-600 hover:bg-red-50 border-red-100' : 'text-emerald-600 hover:bg-emerald-50 border-emerald-100'
                           }`}
                           title={property.is_active ? "Suspend Listing" : "Activate Listing"}
                         >
                           {property.is_active ? <MdBlock size={18} /> : <MdCheckCircle size={18} />}
                         </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600">
        <span>
          {total === 0 ? 'Showing 0 of 0' : `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * pageSize >= total}
            className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
