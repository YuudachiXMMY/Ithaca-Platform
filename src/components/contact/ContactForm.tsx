"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCsrfToken } from "@/hooks/use-csrf-token";

/* ------------------------------------------------------------------ */
/* Schema                                                             */
/* ------------------------------------------------------------------ */

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z
    .string()
    .max(20)
    .optional()
    .or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
  subscribe: z.boolean().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

/* ------------------------------------------------------------------ */
/* Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function ContactForm() {
  const t = useTranslations("contact");
  const { getToken } = useCsrfToken();
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      subscribe: true,
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitState("submitting");
    setErrorMessage("");

    let csrfToken: string;
    try {
      csrfToken = await getToken();
    } catch {
      setSubmitState("error");
      setErrorMessage(t("form.genericError"));
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error ?? `Request failed with status ${response.status}`
        );
      }

      setSubmitState("success");
      reset();
    } catch (err) {
      setSubmitState("error");
      setErrorMessage(
        err instanceof Error ? err.message : t("form.genericError")
      );
    }
  };

  /* ------ Success state ------ */
  if (submitState === "success") {
    return (
      <motion.div
        className="border-t border-border/50 pt-6 text-center"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.4 }}
      >
        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-foreground mb-2">
          {t("form.successTitle")}
        </h3>
        <p className="text-foreground/60 text-sm mb-4">
          {t("form.successMessage")}
        </p>
        <button
          type="button"
          onClick={() => setSubmitState("idle")}
          className="text-accent hover:text-accent-hover transition-colors text-sm font-medium"
        >
          {t("form.sendAnother")}
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      {/* Error banner */}
      {submitState === "error" && (
        <motion.div
          className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 rounded-lg p-3"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.3 }}
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{errorMessage}</p>
        </motion.div>
      )}

      {/* Name + Email side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-xs font-medium text-foreground/70 mb-1.5"
          >
            {t("form.nameLabel")} <span className="text-red-400">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-foreground/25 focus:outline-none focus:border-accent transition-colors"
            placeholder={t("form.namePlaceholder")}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-red-400 text-xs mt-1">
              {errors.name.message
                ? t("form.errors.nameTooLong")
                : t("form.errors.nameRequired")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block text-xs font-medium text-foreground/70 mb-1.5"
          >
            {t("form.emailLabel")} <span className="text-red-400">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-foreground/25 focus:outline-none focus:border-accent transition-colors"
            placeholder={t("form.emailPlaceholder")}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">
              {t("form.errors.emailInvalid")}
            </p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="contact-phone"
          className="block text-xs font-medium text-foreground/70 mb-1.5"
        >
          {t("form.phoneLabel")}
        </label>
        <input
          id="contact-phone"
          type="tel"
          autoComplete="tel"
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-foreground/25 focus:outline-none focus:border-accent transition-colors font-mono"
          placeholder={t("form.phonePlaceholder")}
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-red-400 text-xs mt-1">
            {t("form.errors.phoneTooLong")}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="contact-message"
          className="block text-xs font-medium text-foreground/70 mb-1.5"
        >
          {t("form.messageLabel")}
        </label>
        <textarea
          id="contact-message"
          rows={4}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-foreground/25 focus:outline-none focus:border-accent transition-colors resize-y"
          placeholder={t("form.messagePlaceholder")}
          {...register("message")}
        />
        {errors.message && (
          <p className="text-red-400 text-xs mt-1">
            {t("form.errors.messageTooLong")}
          </p>
        )}
      </div>

      {/* Subscribe + Submit inline */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-3.5 h-3.5 rounded border-border bg-background text-accent focus:ring-accent focus:ring-offset-0"
            {...register("subscribe")}
          />
          <span className="text-xs text-foreground/55">
            {t("form.subscribeLabel")}
          </span>
        </label>

        <button
          type="submit"
          disabled={submitState === "submitting"}
          className="inline-flex items-center justify-center gap-2 bg-accent text-foreground-dark font-semibold px-6 py-2.5 text-sm rounded-full hover:bg-accent-hover active:scale-[0.98] active:-translate-y-[1px] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitState === "submitting" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("form.submittingButton")}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t("form.submitButton")}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
