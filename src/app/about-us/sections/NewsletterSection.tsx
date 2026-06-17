import { NewsletterForm } from "@/components/shared/NewsletterForm";

export function NewsletterSection() {
  return (
    <section className="bg-[#0c0e12] py-20">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Subscribe
            </h2>
            <p className="text-gray-400 mt-2">
              Sign up for our newsletter for the latest programs and events.
            </p>
          </div>
          <div className="lg:flex lg:justify-end">
            <NewsletterForm variant="dark" />
          </div>
        </div>
      </div>
    </section>
  );
}
