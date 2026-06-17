import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-7">
            <h4 className="text-xl font-bold text-gray-900">
              Educators &amp; Instructional Leads
            </h4>
            <p className="text-gray-600 mt-3 leading-relaxed">
              Our teaching team blends classroom expertise with hands-on
              engineering practice. Instructors guide students through core
              concepts, workshop safety, and disciplined project execution -
              helping them build confidence, troubleshoot effectively, and
              develop strong learning habits through consistent feedback and
              coaching.
            </p>
          </div>

          <div className="md:col-span-5">
            <h4 className="text-xl font-bold text-gray-900">
              Industry Mentors &amp; Guest Experts
            </h4>
            <p className="text-gray-600 mt-3 leading-relaxed">
              We invite professionals from engineering, AI, and related
              industries to mentor, review student work, and share real-world
              perspectives. Through guest sessions, portfolio reviews, and
              community connections, students learn what high standards look like
              and how to effectively communicate their work to technical and
              non-technical audiences.
            </p>
            <Link
              href="/contact-us"
              className="mt-6 inline-block px-8 py-3.5 bg-gray-900 text-white font-semibold rounded text-sm hover:bg-gray-800 transition-colors"
            >
              Connect Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
