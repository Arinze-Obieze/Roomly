"use client";

import { useState, useEffect } from "react";
import {
  MdSearch,
  MdBlock,
  MdCheckCircle,
  MdDeleteForever,
  MdLock,
  MdPerson,
  MdShield,
  MdVisibility,
  MdVisibilityOff,
  MdWarning,
} from "react-icons/md";
import { toast } from "sonner";
import Image from "next/image";
import { useAuthContext } from "@/core/contexts/AuthContext";
import { fetchWithCsrf } from "@/core/utils/fetchWithCsrf";

const ACTION_COPY = {
  promote: {
    title: "Grant Superadmin Access",
    description: "This gives the user full platform administration access.",
    confirmLabel: "Grant access",
  },
  demote: {
    title: "Remove Superadmin Access",
    description: "This removes platform administration access from the user.",
    confirmLabel: "Remove access",
  },
  suspend: {
    title: "Suspend User",
    description: "Suspended users are blocked from protected app areas and future logins until restored.",
    confirmLabel: "Suspend user",
    requireReason: true,
  },
  unsuspend: {
    title: "Restore User Access",
    description: "This restores login and protected-app access for the user.",
    confirmLabel: "Restore access",
  },
  delete: {
    title: "Delete User",
    description: "This permanently deletes the user account and its linked data. This cannot be undone.",
    confirmLabel: "Delete user",
    danger: true,
  },
};

export default function UsersTable() {
  const { user: currentUser } = useAuthContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionPassword, setActionPassword] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [showActionPassword, setShowActionPassword] = useState(false);
  const pageSize = 25;
  const allSelectedOnPage =
    users.length > 0 && users.every((entry) => selectedUserIds.includes(entry.id));

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
      setSelectedUserIds((current) =>
        current.filter((userId) => (payload.users || []).some((entry) => entry.id === userId))
      );
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

  const toggleSelectedUser = (userId) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  const toggleSelectAllOnPage = () => {
    setSelectedUserIds((current) => {
      const pageIds = users.map((entry) => entry.id);
      if (pageIds.every((id) => current.includes(id))) {
        return current.filter((id) => !pageIds.includes(id));
      }
      return [...new Set([...current, ...pageIds])];
    });
  };

  const openActionModal = (type, user = null) => {
    const targetUsers = user
      ? [user]
      : users.filter((entry) => selectedUserIds.includes(entry.id));

    if (targetUsers.length === 0) {
      toast.error("Select at least one user first.");
      return;
    }

    setPendingAction({ type, users: targetUsers });
    setActionPassword("");
    setActionReason("");
    setShowActionPassword(false);
  };

  const closeActionModal = () => {
    if (actionSubmitting) return;
    setPendingAction(null);
    setActionPassword("");
    setActionReason("");
    setShowActionPassword(false);
  };

  const submitPendingAction = async () => {
    if (!pendingAction?.users?.length) return;
    if (!actionPassword.trim()) {
      toast.error("Enter your password to confirm this action.");
      return;
    }

    if (ACTION_COPY[pendingAction.type]?.requireReason && !actionReason.trim()) {
      toast.error("Please provide a suspension reason.");
      return;
    }

    setActionSubmitting(true);
    try {
      let response;

      const failures = [];

      for (const targetUser of pendingAction.users) {
        if (pendingAction.type === "promote" || pendingAction.type === "demote") {
          response = await fetchWithCsrf(`/api/superadmin/users/${targetUser.id}/role`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              isSuperAdmin: pendingAction.type === "promote",
              password: actionPassword,
            }),
          });
        } else if (pendingAction.type === "delete") {
          response = await fetchWithCsrf(`/api/superadmin/users/${targetUser.id}/account`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: actionPassword }),
          });
        } else {
          response = await fetchWithCsrf(`/api/superadmin/users/${targetUser.id}/account`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: pendingAction.type,
              password: actionPassword,
              reason: actionReason.trim() || null,
            }),
          });
        }

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          failures.push({
            email: targetUser.email,
            message: payload?.error || "Failed to update user",
          });
        }
      }

      if (failures.length > 0) {
        const firstFailure = failures[0];
        throw new Error(
          failures.length === 1
            ? `${firstFailure.email}: ${firstFailure.message}`
            : `${failures.length} users failed. First error: ${firstFailure.email}: ${firstFailure.message}`
        );
      }

      if (pendingAction.type === "promote") {
        toast.success(`${pendingAction.users.length} user${pendingAction.users.length === 1 ? '' : 's'} granted superadmin access.`);
      } else if (pendingAction.type === "demote") {
        toast.success(`Superadmin access removed for ${pendingAction.users.length} user${pendingAction.users.length === 1 ? '' : 's'}.`);
      } else if (pendingAction.type === "suspend") {
        toast.success(`${pendingAction.users.length} user${pendingAction.users.length === 1 ? '' : 's'} suspended successfully.`);
      } else if (pendingAction.type === "unsuspend") {
        toast.success(`Access restored for ${pendingAction.users.length} user${pendingAction.users.length === 1 ? '' : 's'}.`);
      } else {
        toast.success(`${pendingAction.users.length} user${pendingAction.users.length === 1 ? '' : 's'} deleted successfully.`);
      }

      closeActionModal();
      setSelectedUserIds([]);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user account:", error);
      toast.error(error?.message || "Failed to update user");
    } finally {
      setActionSubmitting(false);
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

      <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{selectedUserIds.length}</span> selected
            <span className="mx-2 text-slate-300">|</span>
            <span>{total} users in this view</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openActionModal("promote")}
              disabled={selectedUserIds.length === 0}
              className="rounded-lg border border-primary/20 px-3 py-2 text-sm font-medium text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Make superadmin
            </button>
            <button
              type="button"
              onClick={() => openActionModal("demote")}
              disabled={selectedUserIds.length === 0}
              className="rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove superadmin
            </button>
            <button
              type="button"
              onClick={() => openActionModal("suspend")}
              disabled={selectedUserIds.length === 0}
              className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suspend selected
            </button>
            <button
              type="button"
              onClick={() => openActionModal("unsuspend")}
              disabled={selectedUserIds.length === 0}
              className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Restore selected
            </button>
            <button
              type="button"
              onClick={() => openActionModal("delete")}
              disabled={selectedUserIds.length === 0}
              className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete selected
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
              <th className="py-4 px-4 w-12">
                <input
                  type="checkbox"
                  checked={allSelectedOnPage}
                  onChange={toggleSelectAllOnPage}
                  aria-label="Select all users on this page"
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
              </th>
              <th className="py-4 px-6 relative">User</th>
              <th className="py-4 px-6">Role</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Joined</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">No users found.</td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelf = user.id === currentUser?.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleSelectedUser(user.id)}
                      aria-label={`Select ${user.full_name || user.email}`}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                  </td>
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
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.account_status === 'suspended'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {user.account_status === 'suspended' ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                       <button
                         onClick={() => openActionModal(user.is_superadmin ? "demote" : "promote", user)}
                         disabled={isSelf && user.is_superadmin}
                         className={`p-2 rounded-lg transition-colors border ${
                           user.is_superadmin ? 'text-red-600 hover:bg-red-50 border-red-100' : 'text-primary hover:bg-primary/10 border-primary/20'
                         } disabled:cursor-not-allowed disabled:opacity-50`}
                         title={isSelf && user.is_superadmin ? "You cannot remove your own superadmin access" : user.is_superadmin ? "Revoke Super Admin" : "Make Super Admin"}
                       >
                         {user.is_superadmin ? <MdBlock size={18} /> : <MdShield size={18} />}
                       </button>
                       <button
                         onClick={() => openActionModal(user.account_status === 'suspended' ? "unsuspend" : "suspend", user)}
                         disabled={isSelf && user.account_status !== 'suspended'}
                         className={`p-2 rounded-lg transition-colors border ${
                           user.account_status === 'suspended'
                             ? 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                             : 'text-amber-700 hover:bg-amber-50 border-amber-200'
                         } disabled:cursor-not-allowed disabled:opacity-50`}
                         title={isSelf && user.account_status !== 'suspended' ? "You cannot suspend your own account" : user.account_status === 'suspended' ? "Restore User" : "Suspend User"}
                       >
                         {user.account_status === 'suspended' ? <MdCheckCircle size={18} /> : <MdLock size={18} />}
                       </button>
                       <button
                         onClick={() => openActionModal("delete", user)}
                         disabled={isSelf}
                         className="p-2 rounded-lg transition-colors border text-rose-700 hover:bg-rose-50 border-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                         title={isSelf ? "You cannot delete your own account here" : "Delete User"}
                       >
                        <MdDeleteForever size={18} />
                       </button>
                    </div>
                  </td>
                  </tr>
                );
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

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className={`rounded-xl p-3 ${ACTION_COPY[pendingAction.type]?.danger ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                <MdWarning size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{ACTION_COPY[pendingAction.type]?.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {ACTION_COPY[pendingAction.type]?.description}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {pendingAction.users.length === 1 ? (
                <>
                  <div className="font-semibold text-slate-900">{pendingAction.users[0].full_name || 'Unnamed User'}</div>
                  <div className="text-slate-500">{pendingAction.users[0].email}</div>
                </>
              ) : (
                <>
                  <div className="font-semibold text-slate-900">{pendingAction.users.length} selected users</div>
                  <div className="text-slate-500">
                    {pendingAction.users.slice(0, 3).map((entry) => entry.email).join(', ')}
                    {pendingAction.users.length > 3 ? ` and ${pendingAction.users.length - 3} more` : ''}
                  </div>
                </>
              )}
            </div>

            {ACTION_COPY[pendingAction.type]?.requireReason ? (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">Reason</label>
                <textarea
                  value={actionReason}
                  onChange={(event) => setActionReason(event.target.value)}
                  rows={3}
                  placeholder="Explain why this user is being suspended"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                />
              </div>
            ) : null}

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Your superadmin password
              </label>
              <p className="mb-2 text-xs text-slate-500">
                Enter the password for the currently signed-in superadmin account to confirm this action.
              </p>
              <div className="relative">
                <input
                  type={showActionPassword ? "text" : "password"}
                  value={actionPassword}
                  onChange={(event) => setActionPassword(event.target.value)}
                  placeholder="Confirm with your superadmin password"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-11 text-sm text-slate-900 outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowActionPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-500 hover:text-slate-700"
                  aria-label={showActionPassword ? "Hide password" : "Show password"}
                >
                  {showActionPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={actionSubmitting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitPendingAction}
                disabled={actionSubmitting}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  ACTION_COPY[pendingAction.type]?.danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {actionSubmitting ? 'Working...' : ACTION_COPY[pendingAction.type]?.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
