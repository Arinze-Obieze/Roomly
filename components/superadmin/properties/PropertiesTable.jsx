"use client";

import { useEffect, useState } from "react";
import {
  MdBlock,
  MdCheckCircle,
  MdHomeWork,
  MdSearch,
  MdThumbDown,
  MdThumbUp,
  MdVisibility,
} from "react-icons/md";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { fetchWithCsrf } from "@/core/utils/fetchWithCsrf";

const bulkActionLabels = {
  approve: "Approve",
  reject: "Reject",
  activate: "Activate",
  suspend: "Suspend",
};

export default function PropertiesTable() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, all: 0 });
  const [approvalStatus, setApprovalStatus] = useState("pending");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const pageSize = 25;

  const allSelectedOnPage =
    properties.length > 0 && properties.every((property) => selectedPropertyIds.includes(property.id));
  const selectedCount = selectedPropertyIds.length;

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search.trim()) params.set("q", search.trim());
      if (approvalStatus !== "all") params.set("approvalStatus", approvalStatus);

      const response = await fetch(`/api/superadmin/properties?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load properties");
      }

      const nextProperties = payload.properties || [];
      setProperties(nextProperties);
      setTotal(payload.total || 0);
      if (payload.stats) setStats(payload.stats);
      setSelectedPropertyIds((current) =>
        current.filter((propertyId) => nextProperties.some((property) => property.id === propertyId))
      );
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
  }, [search, page, approvalStatus]);

  const clearSelection = () => setSelectedPropertyIds([]);

  const toggleSelectedProperty = (propertyId) => {
    setSelectedPropertyIds((current) =>
      current.includes(propertyId)
        ? current.filter((id) => id !== propertyId)
        : [...current, propertyId]
    );
  };

  const toggleSelectAllOnPage = () => {
    setSelectedPropertyIds((current) => {
      const pageIds = properties.map((property) => property.id);
      if (pageIds.every((propertyId) => current.includes(propertyId))) {
        return current.filter((propertyId) => !pageIds.includes(propertyId));
      }

      return [...new Set([...current, ...pageIds])];
    });
  };

  const togglePropertyStatus = async (propertyId, currentStatus) => {
    try {
      const response = await fetchWithCsrf(`/api/superadmin/properties/${propertyId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update property status");
      }

      toast.success(`Property is now ${!currentStatus ? "Active" : "Suspended"}`);
      fetchProperties();
    } catch (error) {
      console.error("Error updating property status:", error);
      toast.error(error?.message || "Failed to update property status");
    }
  };

  const handleApprovalAction = async (propertyId, action) => {
    try {
      const response = await fetchWithCsrf(`/api/superadmin/properties/${propertyId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || `Failed to ${action} property`);
      }

      toast.success(`Property ${action}d successfully`);
      fetchProperties();
    } catch (error) {
      console.error(`Error ${action}ing property:`, error);
      toast.error(error?.message || `Failed to ${action} property`);
    }
  };

  const handleBulkAction = async (action, options = {}) => {
    const applyToAll = options.applyToAll === true;
    const label = bulkActionLabels[action] || action;

    if (!applyToAll && selectedPropertyIds.length === 0) {
      toast.error("Select at least one property first");
      return;
    }

    setBulkSubmitting(true);
    try {
      const response = await fetchWithCsrf("/api/superadmin/properties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          propertyIds: applyToAll ? undefined : selectedPropertyIds,
          applyToAll,
          filters: {
            q: search.trim(),
            approvalStatus,
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || `Failed to ${action} properties`);
      }

      clearSelection();
      toast.success(
        applyToAll
          ? `${label} applied to ${payload.count || 0} properties`
          : `${label} applied to ${payload.count || selectedPropertyIds.length} selected properties`
      );
      fetchProperties();
    } catch (error) {
      console.error(`Error running bulk ${action}:`, error);
      toast.error(error?.message || `Failed to ${action} properties`);
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div className="flex h-full max-h-[800px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col space-y-4 border-b border-slate-100 p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-spaceGrotesk text-lg font-bold text-slate-900">Properties</h2>
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
                clearSelection();
                setSearch(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-100 pb-2">
          {["pending", "approved", "rejected", "all"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setPage(1);
                clearSelection();
                setApprovalStatus(status);
              }}
              className={`flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
                approvalStatus === status
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <span>{status}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  approvalStatus === status ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                }`}
              >
                {stats[status] || 0}
              </span>
              {status === "pending" && <span className="ml-1 font-bold text-amber-500">!</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{selectedCount}</span> selected
            <span className="mx-2 text-slate-300">|</span>
            <span>{total} properties in this view</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBulkAction("approve")}
              disabled={bulkSubmitting || selectedCount === 0}
              className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Approve selected
            </button>
            <button
              onClick={() => handleBulkAction("reject")}
              disabled={bulkSubmitting || selectedCount === 0}
              className="rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject selected
            </button>
            <button
              onClick={() => handleBulkAction("activate")}
              disabled={bulkSubmitting || selectedCount === 0}
              className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Activate selected
            </button>
            <button
              onClick={() => handleBulkAction("suspend")}
              disabled={bulkSubmitting || selectedCount === 0}
              className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suspend selected
            </button>
            <button
              onClick={() => handleBulkAction("approve", { applyToAll: true })}
              disabled={bulkSubmitting || total === 0}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Approve all in view
            </button>
            <button
              onClick={() => handleBulkAction("reject", { applyToAll: true })}
              disabled={bulkSubmitting || total === 0}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject all in view
            </button>
            <button
              onClick={() => handleBulkAction("activate", { applyToAll: true })}
              disabled={bulkSubmitting || total === 0}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Activate all in view
            </button>
            <button
              onClick={() => handleBulkAction("suspend", { applyToAll: true })}
              disabled={bulkSubmitting || total === 0}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suspend all in view
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="w-12 py-4 px-4">
                <input
                  type="checkbox"
                  checked={allSelectedOnPage}
                  onChange={toggleSelectAllOnPage}
                  aria-label="Select all properties on this page"
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
              </th>
              <th className="px-6 py-4">Property</th>
              <th className="px-6 py-4">Lister</th>
              <th className="px-6 py-4">State</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">
                  Loading properties...
                </td>
              </tr>
            ) : properties.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-400">
                  No properties found.
                </td>
              </tr>
            ) : (
              properties.map((property) => {
                let primaryImage =
                  property.property_media?.find((media) => media.is_primary)?.url || property.property_media?.[0]?.url;

                if (primaryImage && !primaryImage.startsWith("http")) {
                  primaryImage = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${primaryImage}`;
                }

                return (
                  <tr key={property.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPropertyIds.includes(property.id)}
                        onChange={() => toggleSelectedProperty(property.id)}
                        aria-label={`Select ${property.title}`}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                          {primaryImage ? (
                            <Image
                              src={primaryImage}
                              alt={property.title}
                              width={48}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <MdHomeWork className="text-slate-400" size={20} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="max-w-[250px] truncate font-medium text-slate-900">{property.title}</div>
                          <div className="max-w-[250px] truncate text-xs text-slate-500">
                            {property.street}, {property.city}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[150px] truncate font-medium text-slate-900">
                        {property.users?.full_name || "Unknown"}
                      </div>
                      <div className="max-w-[150px] truncate text-xs text-slate-500">{property.users?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            property.approval_status === "approved"
                              ? "bg-emerald-50 text-emerald-700"
                              : property.approval_status === "pending"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {property.approval_status || "approved"}
                        </span>
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            property.is_active ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {property.is_active ? "Active" : "Suspended"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">EUR {property.price_per_month}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/listings/${property.id}`}
                          target="_blank"
                          className="rounded-lg border border-transparent p-1.5 text-slate-400 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-primary"
                          title="View Listing"
                        >
                          <MdVisibility size={18} />
                        </Link>

                        {property.approval_status !== "approved" && (
                          <button
                            onClick={() => handleApprovalAction(property.id, "approve")}
                            className="rounded-lg border border-transparent p-1.5 text-emerald-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50"
                            title="Approve Property"
                          >
                            <MdThumbUp size={18} />
                          </button>
                        )}

                        {property.approval_status !== "rejected" && (
                          <button
                            onClick={() => handleApprovalAction(property.id, "reject")}
                            className="rounded-lg border border-transparent p-1.5 text-amber-600 transition-colors hover:border-amber-200 hover:bg-amber-50"
                            title="Reject Property"
                          >
                            <MdThumbDown size={18} />
                          </button>
                        )}

                        <div className="mx-1 h-6 w-px bg-slate-200"></div>

                        <button
                          onClick={() => togglePropertyStatus(property.id, property.is_active)}
                          className={`rounded-lg border p-1.5 transition-colors ${
                            property.is_active
                              ? "border-transparent text-red-500 hover:border-red-100 hover:bg-red-50"
                              : "border-transparent text-blue-500 hover:border-blue-100 hover:bg-blue-50"
                          }`}
                          title={property.is_active ? "Suspend Listing" : "Activate Listing"}
                        >
                          {property.is_active ? <MdBlock size={18} /> : <MdCheckCircle size={18} />}
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

      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm text-slate-600">
        <span>
          {total === 0 ? "Showing 0 of 0" : `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPage((current) => Math.max(1, current - 1));
              clearSelection();
            }}
            disabled={page <= 1}
            className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => {
              setPage((current) => current + 1);
              clearSelection();
            }}
            disabled={page * pageSize >= total}
            className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
