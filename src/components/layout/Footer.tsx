import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { NAV_ITEMS, CONTACT_INFO } from "@/types";
import { NewsletterForm } from "@/components/shared/NewsletterForm";

const QUICK_LINKS = NAV_ITEMS.filter((item) => item.href !== "/");

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-[#0d0f14]" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Top grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* About column */}
          <div>
            <Link href="/" aria-label="Ithaca Family Academy home">
              <Image
                src="/media/images/logo.png"
                alt="Ithaca Family Academy"
                width={140}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground/60">
              Empowering youth to explore the future and build the skills to
              thrive in the AI era through project-based learning, innovation
              challenges, and mentorship.
            </p>
          </div>

          {/* Quick Links column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground/60 transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact Us
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="flex items-start gap-2.5 text-sm text-foreground/60 transition-colors hover:text-accent"
                >
                  <Mail
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {CONTACT_INFO.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT_INFO.phone.replace(/[^+\d]/g, "")}`}
                  className="flex items-start gap-2.5 text-sm text-foreground/60 transition-colors hover:text-accent"
                >
                  <Phone
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {CONTACT_INFO.phone}
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground/60">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                {CONTACT_INFO.address}
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter section */}
        <div className="mt-10 border-t border-border pt-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Stay updated
              </h3>
              <p className="mt-1 text-sm text-foreground/60">
                Subscribe to our newsletter for the latest programs and events.
              </p>
            </div>
            <NewsletterForm variant="dark" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border pt-6">
          <div className="flex flex-col items-center gap-3 text-xs text-foreground/40 sm:flex-row sm:justify-between">
            <p>&copy; {currentYear} Ithaca Family Academy. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="transition-colors hover:text-accent"
              >
                Privacy policy
              </Link>
              <span aria-hidden="true">|</span>
              <Link
                href="/terms"
                className="transition-colors hover:text-accent"
              >
                Terms of service
              </Link>
              <span aria-hidden="true">|</span>
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="transition-colors hover:text-accent"
              >
                {CONTACT_INFO.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
