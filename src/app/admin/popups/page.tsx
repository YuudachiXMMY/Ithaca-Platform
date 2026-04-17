"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Popup {
  id: string;
  title: string;
  content: string;
  buttonText: string | null;
  buttonLink: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  displayRules: string | null;
  createdAt: string;
}

const popupSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
  isActive: z.boolean(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type PopupFormData = z.infer<typeof popupSchema>;

export default function AdminPopupsPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PopupFormData>({
    resolver: zodResolver(popupSchema),
    defaultValues: {
      isActive: false,
    },
  });

  const fetchPopups = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/popups");
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to load popups");
        return;
      }

      setPopups(data.data);
    } catch {
      setError("Failed to load popups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopups();
  }, [fetchPopups]);

  const openCreateForm = () => {
    setEditingPopup(null);
    reset({
      title: "",
      content: "",
      buttonText: "",
      buttonLink: "",
      isActive: false,
      startDate: "",
      endDate: "",
    });
    setShowForm(true);
  };

  const openEditForm = (popup: Popup) => {
    setEditingPopup(popup);
    setValue("title", popup.title);
    setValue("content", popup.content);
    setValue("buttonText", popup.buttonText ?? "");
    setValue("buttonLink", popup.buttonLink ?? "");
    setValue("isActive", popup.isActive);
    setValue(
      "startDate",
      popup.startDate ? popup.startDate.slice(0, 16) : "",
    );
    setValue(
      "endDate",
      popup.endDate ? popup.endDate.slice(0, 16) : "",
    );
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPopup(null);
    reset();
  };

  const onSubmitForm = async (formData: PopupFormData) => {
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: formData.title,
        content: formData.content,
        buttonText: formData.buttonText || undefined,
        buttonLink: formData.buttonLink || undefined,
        isActive: formData.isActive,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : null,
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : null,
      };

      if (editingPopup) {
        const res = await fetch("/api/admin/popups", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: editingPopup.id }),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error ?? "Failed to update popup");
          return;
        }
      } else {
        const res = await fetch("/api/admin/popups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error ?? "Failed to create popup");
          return;
        }
      }

      closeForm();
      await fetchPopups();
    } catch {
      setError(
        editingPopup ? "Failed to update popup" : "Failed to create popup",
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this popup?")) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch("/api/admin/popups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to delete popup");
        return;
      }

      await fetchPopups();
    } catch {
      setError("Failed to delete popup");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#f7f7f7]">Pop-ups</h1>
        <button
          onClick={showForm ? closeForm : openCreateForm}
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
              <span>New Popup</span>
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
            {editingPopup ? "Edit Popup" : "Create New Popup"}
          </h2>

          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="title"
                  className="mb-1.5 block text-sm font-medium text-[#ccc]"
                >
                  Title
                </label>
                <input
                  {...register("title")}
                  id="title"
                  type="text"
                  placeholder="Popup title"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#161616] px-4 py-2.5 text-sm text-[#f7f7f7] placeholder-[#555] transition-colors focus:border-[#ccdef0] focus:outline-none"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 text-sm text-[#ccc]">
                  <input
                    {...register("isActive")}
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#2a2a2a] bg-[#161616] accent-[#ccdef0]"
                  />
                  Active
                </label>
              </div>
            </div>

            <div>
              <label
                htmlFor="content"
                className="mb-1.5 block text-sm font-medium text-[#ccc]"
              >
                Content
              </label>
              <textarea
                {...register("content")}
                id="content"
                rows={4}
                placeholder="Popup content (supports HTML)"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#161616] px-4 py-2.5 text-sm text-[#f7f7f7] placeholder-[#555] transition-colors focus:border-[#ccdef0] focus:outline-none"
              />
              {errors.content && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.content.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="buttonText"
                  className="mb-1.5 block text-sm font-medium text-[#ccc]"
                >
                  Button Text (optional)
                </label>
                <input
                  {...register("buttonText")}
                  id="buttonText"
                  type="text"
                  placeholder="Learn More"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#161616] px-4 py-2.5 text-sm text-[#f7f7f7] placeholder-[#555] transition-colors focus:border-[#ccdef0] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="buttonLink"
                  className="mb-1.5 block text-sm font-medium text-[#ccc]"
                >
                  Button Link (optional)
                </label>
                <input
                  {...register("buttonLink")}
                  id="buttonLink"
                  type="text"
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#161616] px-4 py-2.5 text-sm text-[#f7f7f7] placeholder-[#555] transition-colors focus:border-[#ccdef0] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="startDate"
                  className="mb-1.5 block text-sm font-medium text-[#ccc]"
                >
                  Start Date (optional)
                </label>
                <input
                  {...register("startDate")}
                  id="startDate"
                  type="datetime-local"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#161616] px-4 py-2.5 text-sm text-[#f7f7f7] transition-colors focus:border-[#ccdef0] focus:outline-none [color-scheme:dark]"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="mb-1.5 block text-sm font-medium text-[#ccc]"
                >
                  End Date (optional)
                </label>
                <input
                  {...register("endDate")}
                  id="endDate"
                  type="datetime-local"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#161616] px-4 py-2.5 text-sm text-[#f7f7f7] transition-colors focus:border-[#ccdef0] focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-[#2a2a2a] px-4 py-2.5 text-sm text-[#ccc] transition-colors hover:bg-[#2a2a2a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-[#ccdef0] px-6 py-2.5 text-sm font-semibold text-[#161616] transition-colors hover:bg-[#b8d0e8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>{editingPopup ? "Update" : "Create"}</span>
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
        ) : popups.length === 0 ? (
          <div className="px-6 py-16 text-center text-[#888]">
            No popups yet. Create your first one above.
          </div>
        ) : (
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-left">
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#888]">
                  Title
                </th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#888]">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#888]">
                  Date Range
                </th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#888]">
                  Created
                </th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#888]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {popups.map((popup) => (
                <tr key={popup.id} className="hover:bg-[#252525]">
                  <td className="px-6 py-4 text-sm text-[#f7f7f7]">
                    {popup.title}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        popup.isActive
                          ? "bg-green-500/10 text-green-400"
                          : "bg-gray-500/10 text-gray-400"
                      }`}
                    >
                      {popup.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#888]">
                    {popup.startDate || popup.endDate
                      ? `${popup.startDate ? new Date(popup.startDate).toLocaleDateString() : "..."} - ${popup.endDate ? new Date(popup.endDate).toLocaleDateString() : "..."}`
                      : "Always"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#888]">
                    {new Date(popup.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(popup)}
                        className="text-[#888] transition-colors hover:text-[#ccdef0]"
                        aria-label={`Edit popup: ${popup.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(popup.id)}
                        disabled={deletingId === popup.id}
                        className="text-[#888] transition-colors hover:text-red-400 disabled:opacity-50"
                        aria-label={`Delete popup: ${popup.title}`}
                      >
                        {deletingId === popup.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
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
