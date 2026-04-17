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
  hidden: { opacity: 0, y: 20 },
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
      subscribe: false,
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
        className="bg-card-bg border border-border rounded-2xl p-10 text-center"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.5 }}
      >
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-foreground mb-3">
          Message Sent!
        </h3>
        <p className="text-foreground/70 mb-6">
          Thank you for reaching out. We will get back to you shortly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitState("idle")}
          className="text-accent hover:text-accent-hover transition-colors font-medium"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card-bg border border-border rounded-2xl p-8 md:p-10 flex flex-col gap-6"
      noValidate
    >
      {/* Error banner */}
      {submitState === "error" && (
        <motion.div
          className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.3 }}
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{errorMessage}</p>
        </motion.div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-foreground/80 mb-2"
        >
          Name <span className="text-red-400">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-foreground/30 focus:outline-none focus:border-accent transition-colors"
          placeholder="Your name"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-red-400 text-sm mt-1.5">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-medium text-foreground/80 mb-2"
        >
          Email <span className="text-red-400">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-foreground/30 focus:outline-none focus:border-accent transition-colors"
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-red-400 text-sm mt-1.5">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="contact-phone"
          className="block text-sm font-medium text-foreground/80 mb-2"
        >
          Phone
        </label>
        <input
          id="contact-phone"
          type="tel"
          autoComplete="tel"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-foreground/30 focus:outline-none focus:border-accent transition-colors"
          placeholder="+1 (___) ___-____"
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-red-400 text-sm mt-1.5">{errors.phone.message}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-foreground/80 mb-2"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-foreground/30 focus:outline-none focus:border-accent transition-colors resize-y"
          placeholder="How can we help you?"
          {...register("message")}
        />
        {errors.message && (
          <p className="text-red-400 text-sm mt-1.5">
            {errors.message.message}
          </p>
        )}
      </div>

      {/* Subscribe checkbox */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          className="mt-1 w-4 h-4 rounded border-border bg-background text-accent focus:ring-accent focus:ring-offset-0"
          {...register("subscribe")}
        />
        <span className="text-sm text-foreground/70">
          Sign me up for the email list to receive updates and announcements.
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitState === "submitting"}
        className="inline-flex items-center justify-center gap-2 bg-accent text-foreground-dark font-semibold px-8 py-4 rounded-full hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitState === "submitting" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}
