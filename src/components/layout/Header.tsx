"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "@/types";
import { cn } from "@/lib/utils";

/* Split nav items: left group / center logo / right group */
const LEFT_NAV = NAV_ITEMS.filter((item) => item.href !== "/contact-us");
const RIGHT_NAV = NAV_ITEMS.filter((item) => item.href === "/contact-us");

/* ------------------------------------------------------------------ */
/*  Desktop dropdown for items with children                          */
/* ------------------------------------------------------------------ */

function DesktopDropdown({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleEnter() {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setOpen(true);
  }

  function handleLeave() {
    closeTimeout.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        href={item.href}
        className={cn(
          "relative flex items-center gap-1.5 py-2 text-[13px] font-medium tracking-[0.08em] uppercase transition-colors duration-300",
          isActive ? "text-accent" : "text-white/60 hover:text-white"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {isActive && (
          <span
            className="absolute -left-3.5 top-1/2 -translate-y-1/2 text-accent"
            aria-hidden="true"
          >
            -
          </span>
        )}
        {item.label}
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </Link>

      <AnimatePresence>
        {open && item.children && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0c10]/90 py-2 shadow-2xl backdrop-blur-xl"
            role="menu"
          >
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className="block px-4 py-2.5 text-sm text-white/55 transition-colors hover:bg-white/5 hover:text-white"
                role="menuitem"
              >
                {child.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile navigation panel                                           */
/* ------------------------------------------------------------------ */

function MobileNav({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  function toggleExpanded(label: string) {
    setExpandedItem((prev) => (prev === label ? null : label));
  }

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.nav
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-[#0a0c10]/95 shadow-2xl backdrop-blur-xl lg:hidden"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-end p-4">
              <button
                onClick={onClose}
                className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="flex-1 space-y-1 overflow-y-auto px-4">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const hasChildren =
                  item.children && item.children.length > 0;
                const isExpanded = expandedItem === item.label;

                return (
                  <li key={item.href}>
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        className={cn(
                          "flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-accent/10 text-accent"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {item.label}
                      </Link>
                      {hasChildren && (
                        <button
                          onClick={() => toggleExpanded(item.label)}
                          className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                          aria-expanded={isExpanded}
                          aria-label={`Expand ${item.label} submenu`}
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              isExpanded && "rotate-180"
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {hasChildren && isExpanded && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-4"
                        >
                          {item.children!.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className="block rounded-lg px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                            */
/* ------------------------------------------------------------------ */

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((p) => !p), []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function checkActive(href: string) {
    return href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-500 ease-out",
        scrolled
          ? "bg-[#0a0c10]/70 border-b border-white/[0.06] backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div
        className={cn(
          "mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] px-6 sm:px-8 lg:px-12 transition-all duration-500 ease-out",
          scrolled
            ? "h-18 items-center"
            : "h-24 lg:h-32 items-start pt-5 lg:pt-7"
        )}
      >
        {/* Left slot: desktop nav */}
        <div className="flex items-center">
          <nav
            className="hidden items-center gap-10 lg:flex"
            aria-label="Main navigation"
          >
            {LEFT_NAV.map((item) => {
              const active = checkActive(item.href);

              if (item.children && item.children.length > 0) {
                return (
                  <DesktopDropdown
                    key={item.href}
                    item={item}
                    isActive={active}
                  />
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative py-2 text-[13px] font-medium tracking-[0.08em] uppercase transition-colors duration-300",
                    active ? "text-accent" : "text-white/60 hover:text-white"
                  )}
                >
                  {active && (
                    <span
                      className="absolute -left-3.5 top-1/2 -translate-y-1/2 text-accent"
                      aria-hidden="true"
                    >
                      -
                    </span>
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: logo */}
        <Link
          href="/"
          className="shrink-0 justify-self-center"
          aria-label="Ithaca Family Academy home"
        >
          <Image
            src="/media/images/site/logo.png"
            alt="Ithaca Family Academy"
            width={200}
            height={60}
            className={cn(
              "w-auto transition-all duration-500 ease-out",
              scrolled ? "h-12" : "h-20 lg:h-24"
            )}
            priority
          />
        </Link>

        {/* Right slot: desktop nav + mobile hamburger */}
        <div className="flex items-center justify-end">
          <nav className="hidden items-center gap-10 lg:flex">
            {RIGHT_NAV.map((item) => {
              const active = checkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative py-2 text-[13px] font-medium tracking-[0.08em] uppercase transition-colors duration-300",
                    active ? "text-accent" : "text-white/60 hover:text-white"
                  )}
                >
                  {active && (
                    <span
                      className="absolute -left-3.5 top-1/2 -translate-y-1/2 text-accent"
                      aria-hidden="true"
                    >
                      -
                    </span>
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={toggleMobile}
            className="rounded-lg p-2 text-white/70 transition-colors hover:text-white lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={closeMobile} pathname={pathname} />
    </header>
  );
}
