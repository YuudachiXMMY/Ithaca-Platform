"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, MessageSquare, Mail, Megaphone, Loader2 } from "lucide-react";

interface DashboardStats {
  totalSubscribers: number;
  totalContacts: number;
  campaignsSent: number;
  activePopups: number;
}

const STAT_CARDS = [
  { key: "totalSubscribers", label: "Total Subscribers", icon: Users },
  { key: "totalContacts", label: "Total Contacts", icon: MessageSquare },
  { key: "campaignsSent", label: "Campaigns Sent", icon: Mail },
  { key: "activePopups", label: "Active Popups", icon: Megaphone },
] as const;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const [subscribersRes, campaignsRes, popupsRes] = await Promise.all([
        fetch("/api/admin/subscribers?page=1&limit=1"),
        fetch("/api/admin/emails"),
        fetch("/api/admin/popups"),
      ]);

      const subscribersData = await subscribersRes.json();
      const campaignsData = await campaignsRes.json();
      const popupsData = await popupsRes.json();

      const totalSubscribers =
        subscribersData.data?.pagination?.total ?? 0;

      const campaigns = campaignsData.data ?? [];
      const campaignsSent = (campaigns as Array<{ status: string }>).filter(
        (c) => c.status === "sent",
      ).length;

      const popups = popupsData.data ?? [];
      const activePopups = (popups as Array<{ isActive: boolean }>).filter(
        (p) => p.isActive,
      ).length;

      setStats({
        totalSubscribers,
        totalContacts: 0,
        campaignsSent,
        activePopups,
      });
    } catch {
      setError("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#ccdef0]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-[#f7f7f7]">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;

          return (
            <div
              key={card.key}
              className="rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-[#888]">{card.label}</span>
                <Icon className="h-5 w-5 text-[#ccdef0]" />
              </div>
              <p className="text-3xl font-bold text-[#f7f7f7]">{value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
