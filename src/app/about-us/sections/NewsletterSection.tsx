import { NewsletterForm } from "@/components/shared/NewsletterForm";

export function NewsletterSection() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Subscribe</h2>
        <p className="text-gray-600 mb-4">
          Sign up for our newsletter for the latest programs and events!
        </p>
        <NewsletterForm variant="light" />
      </div>
    </section>
  );
}
