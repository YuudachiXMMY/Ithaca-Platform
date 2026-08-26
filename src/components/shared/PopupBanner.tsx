"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PopupData {
  id: string;
  title: string;
  content: string;
  buttonText?: string;
  buttonLink?: string;
}

const STORAGE_KEY = "ithaca-popup-dismissed";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
} as const;

export function PopupBanner() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    const controller = new AbortController();

    async function fetchPopup() {
      try {
        const response = await fetch("/api/admin/popups/active", {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const result = await response.json();
        if (result.data) {
          setPopup(result.data);
          setVisible(true);
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    fetchPopup();
    return () => controller.abort();
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "true");
  }, []);

  if (!popup) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          aria-modal="true"
          role="dialog"
          aria-labelledby="popup-title"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md rounded-2xl border border-border bg-card-bg p-6 shadow-2xl sm:p-8"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute right-3 top-3 rounded-full p-1.5 text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Close popup"
            >
              <X className="h-5 w-5" />
            </button>

            <h2
              id="popup-title"
              className="pr-8 text-xl font-bold text-foreground sm:text-2xl"
            >
              {popup.title}
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-foreground/70 sm:text-base">
              {popup.content}
            </p>

            {popup.buttonText && (
              <div className="mt-6">
                {popup.buttonLink ? (
                  <Button
                    as="link"
                    href={popup.buttonLink}
                    size="md"
                    onClick={dismiss}
                  >
                    {popup.buttonText}
                  </Button>
                ) : (
                  <Button size="md" onClick={dismiss}>
                    {popup.buttonText}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
