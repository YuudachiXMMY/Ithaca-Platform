"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Schema                                                             */
/* ------------------------------------------------------------------ */

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  message: z.string().max(2000, "Message is too long").optional().or(z.literal("")),
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

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        err instanceof Error ? err.message : "Something went wrong. Please try again."
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
          Message Sent!
        </h3>
        <p className="text-foreground/60 text-sm mb-4">
          Thank you for reaching out. We will get back to you shortly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitState("idle")}
          className="text-accent hover:text-accent-hover transition-colors text-sm font-medium"
        >
          Send another message
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
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-foreground/25 focus:outline-none focus:border-accent transition-colors"
            placeholder="Your name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block text-xs font-medium text-foreground/70 mb-1.5"
          >
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-foreground/25 focus:outline-none focus:border-accent transition-colors"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="contact-phone"
          className="block text-xs font-medium text-foreground/70 mb-1.5"
        >
          Phone
        </label>
        <input
          id="contact-phone"
          type="tel"
          autoComplete="tel"
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-foreground/25 focus:outline-none focus:border-accent transition-colors font-mono"
          placeholder="+1 (___) ___-____"
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="contact-message"
          className="block text-xs font-medium text-foreground/70 mb-1.5"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          rows={4}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-foreground/25 focus:outline-none focus:border-accent transition-colors resize-y"
          placeholder="How can we help you?"
          {...register("message")}
        />
        {errors.message && (
          <p className="text-red-400 text-xs mt-1">
            {errors.message.message}
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
            Subscribe to updates
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
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send
            </>
          )}
        </button>
      </div>
    </form>
  );
}
