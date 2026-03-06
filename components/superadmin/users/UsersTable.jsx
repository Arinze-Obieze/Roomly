"use client";

import { useState, useEffect } from "react";
import { MdSearch, MdBlock, MdCheckCircle, MdPerson } from "react-icons/md";
import { toast } from "sonner";
import Image from "next/image";
import { useAuthContext } from "@/core/contexts/AuthContext";

export default function UsersTable() {
  const { user: currentUser } = useAuthContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search.trim()) params.set('q', search.trim());

      const response = await fetch(`/api/superadmin/users?${params.toString()}`, {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load users');
      }

      setUsers(payload.users || []);
      setTotal(payload.total || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const toggleSuperAdmin = async (userId, currentStatus) => {
    if (currentStatus && userId === currentUser?.id) {
      toast.error("You cannot remove your own superadmin access.");
      return;
    }

    try {
      const response = await fetch(`/api/superadmin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuperAdmin: !currentStatus }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update user role");
      }

      toast.success(`User is now ${!currentStatus ? 'a Super Admin' : 'a regular user'}`);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error(error?.message || "Failed to update user role");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[800px]">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
           <h2 className="text-lg font-bold font-spaceGrotesk text-slate-900">Registered Users</h2>
           <p className="text-sm text-slate-500">Manage all users on the platform</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
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
              <th className="py-4 px-6 relative">User</th>
              <th className="py-4 px-6">Role</th>
              <th className="py-4 px-6">Joined</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-400">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-400">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                        {user.profile_picture ? (
                          <Image src={user.profile_picture} alt={user.full_name || 'User'} width={36} height={36} className="object-cover w-full h-full" />
                        ) : (
                          <MdPerson className="text-slate-400" size={20} />
                        )}
                      </div>
                      <div className="min-w-0">
                         <div className="font-medium text-slate-900 truncate">{user.full_name || 'Unnamed User'}</div>
                         <div className="text-slate-500 text-xs truncate max-w-[200px]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                      ${user.is_superadmin 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {user.is_superadmin ? 'Super Admin' : 'User'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                       {/* Basic toggle for superadmin for demonstration in V1 */}
                       <button 
                         onClick={() => toggleSuperAdmin(user.id, user.is_superadmin)}
                         className={`p-2 rounded-lg transition-colors border ${
                           user.is_superadmin ? 'text-red-600 hover:bg-red-50 border-red-100' : 'text-primary hover:bg-primary/10 border-primary/20'
                         }`}
                         title={user.is_superadmin ? "Revoke Super Admin" : "Make Super Admin"}
                       >
                         {user.is_superadmin ? <MdBlock size={18} /> : <MdCheckCircle size={18} />}
                       </button>
                    </div>
                  </td>
                </tr>
              ))
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
