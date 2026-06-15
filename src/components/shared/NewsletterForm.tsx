"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const subscribeSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type SubscribeFormData = z.infer<typeof subscribeSchema>;

interface NewsletterFormProps {
  variant?: "light" | "dark";
  className?: string;
}

type SubmitStatus = "idle" | "loading" | "success" | "error";

export function NewsletterForm({
  variant = "dark",
  className,
}: NewsletterFormProps) {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubscribeFormData>({
    resolver: zodResolver(subscribeSchema),
  });

  async function onSubmit(data: SubscribeFormData) {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(result.error ?? "Subscription failed. Please try again.");
        return;
      }

      setStatus("success");
      setMessage("Thank you for subscribing!");
      reset();
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again later.");
    }
  }

  const isLight = variant === "light";

  return (
    <div className={cn("w-full max-w-md", className)}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3 sm:flex-row"
        noValidate
        aria-label="Newsletter signup"
      >
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={
            errors.email
              ? "newsletter-error"
              : status !== "idle"
                ? "newsletter-status"
                : undefined
          }
          className={cn(
            "flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors",
            "placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent",
            isLight
              ? "border-border bg-white text-foreground-dark"
              : "border-border bg-[#151720] text-foreground"
          )}
          {...register("email")}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors",
            "bg-accent text-foreground-dark hover:bg-accent-hover",
            "disabled:pointer-events-none disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          {status === "loading" && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          Sign up
        </button>
      </form>

      {errors.email && (
        <p
          id="newsletter-error"
          className="mt-2 flex items-center gap-1.5 text-sm text-red-400"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {errors.email.message}
        </p>
      )}

      {status === "success" && (
        <p
          id="newsletter-status"
          className="mt-2 flex items-center gap-1.5 text-sm text-emerald-400"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}

      {status === "error" && !errors.email && (
        <p
          id="newsletter-status"
          className="mt-2 flex items-center gap-1.5 text-sm text-red-400"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}
    </div>
  );
}
