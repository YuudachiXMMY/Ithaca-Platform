"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Mail, Phone, MessageCircle } from "lucide-react";
import { CONTACT_INFO } from "@/types/index";
import { ContactForm } from "@/components/contact/ContactForm";

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const CONTACT_CHANNELS = [
  {
    icon: MapPin,
    label: "Address",
    value: CONTACT_INFO.address,
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_INFO.address)}`,
  },
  {
    icon: Mail,
    label: "Email",
    value: CONTACT_INFO.email,
    href: `mailto:${CONTACT_INFO.email}`,
  },
  {
    icon: Phone,
    label: "Phone",
    value: CONTACT_INFO.phone,
    href: `tel:${CONTACT_INFO.phone.replace(/[^+\d]/g, "")}`,
  },
  {
    icon: MessageCircle,
    label: "WeChat",
    value: CONTACT_INFO.wechat,
    href: undefined,
  },
] as const;

/* ------------------------------------------------------------------ */
/* Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function ContactUsPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] opacity-20 pointer-events-none">
          <Image
            src="/media/images/site/contact-blob-55e41b4.png"
            alt=""
            fill
            className="object-contain"
            aria-hidden="true"
          />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
          >
            Contact Us
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Have a question or want to learn more? We would love to hear from
            you.
          </motion.p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="px-6 pb-16">
        <motion.div
          className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {CONTACT_CHANNELS.map((channel) => {
            const content = (
              <div className="bg-card-bg border border-border rounded-2xl p-6 h-full hover:border-accent/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <channel.icon className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm font-medium text-accent uppercase tracking-wide mb-1">
                  {channel.label}
                </p>
                <p className="text-foreground/80 text-sm leading-relaxed">
                  {channel.value}
                </p>
              </div>
            );

            return (
              <motion.div
                key={channel.label}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                {channel.href ? (
                  <a
                    href={channel.href}
                    target={channel.label === "Address" ? "_blank" : undefined}
                    rel={
                      channel.label === "Address"
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="block h-full"
                  >
                    {content}
                  </a>
                ) : (
                  content
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Form + Map */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact Form */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
              Send Us a Message
            </h2>
            <ContactForm />
          </motion.div>

          {/* Google Maps */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
              Find Us
            </h2>
            <div className="rounded-2xl overflow-hidden border border-border h-[400px] lg:h-full lg:min-h-[500px]">
              <iframe
                title="Ithaca Family Academy Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2882.5!2d-79.4!3d43.78!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s205+Placer+Ct+unit+325%2C+North+York+ON!5e0!3m2!1sen!2sca!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
