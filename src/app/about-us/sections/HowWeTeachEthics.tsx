import Image from "next/image";

export function HowWeTeachEthics() {
  return (
    <section className="bg-white py-24" aria-label="How We Teach and Ethics">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left column: How We Teach */}
          <div>
            <Image
              src="/media/images/programs/ai-camp/ai-camp-HB8A5242.jpg"
              alt="Students learning through hands-on projects"
              width={800}
              height={400}
              className="aspect-[2/1] rounded object-cover w-full"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <h4 className="text-xl font-bold text-gray-900 mt-4">
              How We Teach
            </h4>
            <p className="text-gray-600 mt-3">
              We teach through a studio-style, project-based model where
              students learn by building. Each cohort works in small teams with
              clear weekly milestones, structured mentoring, and frequent
              technical reviews. Our consistent workflow - define the problem,
              design, build, test, iterate, and present - helps students develop
              not only hands-on competence, but also the ability to document
              decisions and communicate results with clarity.
            </p>
          </div>

          {/* Right column: Ethics & Integrity */}
          <div>
            <Image
              src="/media/images/programs/ai-camp/ai-camp-HB8A5065.jpg"
              alt="Students discussing AI ethics and integrity"
              width={800}
              height={400}
              className="aspect-[2/1] rounded object-cover w-full"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <h4 className="text-xl font-bold text-gray-900 mt-4">
              Ethics &amp; Integrity
            </h4>
            <p className="text-gray-600 mt-3">
              We hold a high bar for safety, academic honesty, and responsible
              technology use. Students are taught to cite sources properly,
              document AI-assisted work transparently, and maintain design logs
              that can be reviewed through demonstrations and Q&amp;A. In the
              workshop, we enforce risk-tiered tool training and supervision,
              allowing students to build ambitious projects while learning
              professional standards and safe practices.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
