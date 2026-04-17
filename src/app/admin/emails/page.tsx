"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Send,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Campaign {
  id: string;
  subject: string;
  body: string;
  status: string;
  recipientCount: number;
  sentAt: string | null;
  createdAt: string;
}

const campaignSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-400",
  sending: "bg-blue-500/10 text-blue-400",
  sent: "bg-green-500/10 text-green-400",
  failed: "bg-red-500/10 text-red-400",
};

export default function AdminEmailsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
  });

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/emails");
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to load campaigns");
        return;
      }

      setCampaigns(data.data);
    } catch {
      setError("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const onCreateCampaign = async (formData: CampaignFormData) => {
    setError(null);

    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to create campaign");
        return;
      }

      reset();
      setShowForm(false);
      await fetchCampaigns();
    } catch {
      setError("Failed to create campaign");
    }
  };

  const handleSend = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to send this campaign to all active subscribers?",
      )
    ) {
      return;
    }

    setSendingId(id);
    setError(null);

    try {
      const res = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to send campaign");
        return;
      }

      await fetchCampaigns();
    } catch {
      setError("Failed to send campaign");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#f7f7f7]">Email Campaigns</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-[#ccdef0] px-4 py-2 text-sm font-semibold text-[#161616] transition-colors hover:bg-[#b8d0e8]"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>New Campaign</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <div className="mb-8 rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#f7f7f7]">
            Create New Campaign
          </h2>

          <form onSubmit={handleSubmit(onCreateCampaign)} className="space-y-4">
            <div>
              <label
                htmlFor="subject"
                className="mb-1.5 block text-sm font-medium text-[#ccc]"
              >
                Subject
              </label>
              <input
                {...register("subject")}
                id="subject"
                type="text"
                placeholder="Email subject line"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#161616] px-4 py-2.5 text-sm text-[#f7f7f7] placeholder-[#555] transition-colors focus:border-[#ccdef0] focus:outline-none"
              />
              {errors.subject && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.subject.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="body"
                className="mb-1.5 block text-sm font-medium text-[#ccc]"
              >
                Body (HTML)
              </label>
              <textarea
                {...register("body")}
                id="body"
                rows={10}
                placeholder="<h1>Hello!</h1><p>Your email content here...</p>"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#161616] px-4 py-2.5 font-mono text-sm text-[#f7f7f7] placeholder-[#555] transition-colors focus:border-[#ccdef0] focus:outline-none"
              />
              {errors.body && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.body.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-[#ccdef0] px-6 py-2.5 text-sm font-semibold text-[#161616] transition-colors hover:bg-[#b8d0e8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Create Campaign</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1e1e1e]">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#ccdef0]" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="px-6 py-16 text-center text-[#888]">
            No campaigns yet. Create your first one above.
          </div>
        ) : (
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-left">
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#888]">
                  Subject
                </th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#888]">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#888]">
                  Recipients
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
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-[#252525]">
                  <td className="px-6 py-4 text-sm text-[#f7f7f7]">
                    {campaign.subject}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[campaign.status] ?? STATUS_STYLES.draft
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#ccc]">
                    {campaign.recipientCount}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#888]">
                    {campaign.sentAt
                      ? new Date(campaign.sentAt).toLocaleDateString()
                      : new Date(campaign.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {campaign.status === "draft" && (
                      <button
                        onClick={() => handleSend(campaign.id)}
                        disabled={sendingId === campaign.id}
                        className="flex items-center gap-1.5 rounded-lg bg-[#ccdef0]/10 px-3 py-1.5 text-xs font-medium text-[#ccdef0] transition-colors hover:bg-[#ccdef0]/20 disabled:opacity-50"
                        aria-label={`Send campaign: ${campaign.subject}`}
                      >
                        {sendingId === campaign.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        <span>Send</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
