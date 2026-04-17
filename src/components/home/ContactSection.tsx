"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react";

interface ContactItem {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly value: string;
  readonly href?: string;
}

const CONTACT_ITEMS: readonly ContactItem[] = [
  {
    icon: MapPin,
    label: "Address",
    value: "Waterloo, Ontario, Canada",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (519) 998-9368",
    href: "tel:+15199989368",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@ithacateens.com",
    href: "mailto:info@ithacateens.com",
  },
] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function ContactSection() {
  return (
    <section className="bg-background py-20 md:py-28" aria-label="Contact Us">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Get In Touch
            </h2>
            <p className="mb-10 max-w-md text-foreground/60">
              Ready to set your child on the road to discovery? Contact us to
              learn more about our programs and enrollment.
            </p>

            <motion.ul
              className="mb-10 space-y-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              {CONTACT_ITEMS.map((item) => (
                <ContactRow key={item.label} item={item} />
              ))}
            </motion.ul>

            <Link
              href="/contact-us"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-semibold text-foreground-dark transition-colors duration-300 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span>Contact Us</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Decorative visual */}
          <motion.div
            className="hidden lg:flex lg:items-center lg:justify-center"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
            aria-hidden="true"
          >
            <div className="relative flex h-80 w-80 items-center justify-center">
              {/* Background decorative circles */}
              <div className="absolute h-72 w-72 rounded-full border border-accent/20" />
              <div className="absolute h-56 w-56 rounded-full border border-accent/15" />
              <div className="absolute h-40 w-40 rounded-full border border-accent/10" />
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/10">
                <Mail className="h-10 w-10 text-accent" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ContactRow({ item }: { readonly item: ContactItem }) {
  const Icon = item.icon;

  const content = (
    <motion.li
      className="flex items-start gap-4"
      variants={itemVariants}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <div>
        <p className="text-xs font-medium tracking-wider text-foreground/50 uppercase">
          {item.label}
        </p>
        <p className="text-base text-foreground">{item.value}</p>
      </div>
    </motion.li>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        className="block transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {content}
      </a>
    );
  }

  return content;
}
