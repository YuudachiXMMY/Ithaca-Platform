"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: string;
  subscribedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSubscribers = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/subscribers?page=${page}&limit=20`,
      );
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to load subscribers");
        return;
      }

      setSubscribers(data.data.subscribers);
      setPagination(data.data.pagination);
    } catch {
      setError("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers(1);
  }, [fetchSubscribers]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subscriber?")) {
      return;
    }

    setDeletingId(id);

    try {
      const res = await fetch("/api/admin/subscribers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to delete subscriber");
        return;
      }

      await fetchSubscribers(pagination.page);
    } catch {
      setError("Failed to delete subscriber");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Email", "Name", "Status", "Subscribed At"];
    const rows = subscribers.map((s) => [
      s.email,
      s.name ?? "",
      s.status,
      new Date(s.subscribedAt).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#f7f7f7]">Subscribers</h1>
        <button
          onClick={handleExportCSV}
          disabled={subscribers.length === 0}
          className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] px-4 py-2 text-sm text-[#f7f7f7] transition-colors hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1e1e1e]">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#ccdef0]" />
          </div>
        ) : subscribers.length === 0 ? (
          <div className="px-6 py-16 text-center text-[#888]">
            No subscribers yet
          </div>
        ) : (
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-left">
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#888]">
                  Email
                </th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#888]">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#888]">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#888]">
                  Date
                </th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#888]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-[#252525]">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#f7f7f7]">
                    {subscriber.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#ccc]">
                    {subscriber.name ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        subscriber.status === "active"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {subscriber.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#888]">
                    {new Date(subscriber.subscribedAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <button
                      onClick={() => handleDelete(subscriber.id)}
                      disabled={deletingId === subscriber.id}
                      className="text-[#888] transition-colors hover:text-red-400 disabled:opacity-50"
                      aria-label={`Delete subscriber ${subscriber.email}`}
                    >
                      {deletingId === subscriber.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#888]">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchSubscribers(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-sm text-[#ccc] transition-colors hover:bg-[#1e1e1e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>
            <span className="px-2 text-sm text-[#888]">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchSubscribers(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1 rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-sm text-[#ccc] transition-colors hover:bg-[#1e1e1e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
