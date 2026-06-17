import Image from "next/image";

export function HowWeTeachEthics() {
  return (
    <section className="bg-[#111318] py-28" aria-label="How We Teach and Ethics">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Block 1: Full-width cinematic image with text offset below-right */}
        <div>
          <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
            <Image
              src="/media/images/programs/ai-camp/ai-camp-HB8A5242.jpg"
              alt="Students learning through hands-on projects"
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 mt-8">
            <div className="hidden lg:block" aria-hidden="true" />
            <div>
              <h3 className="text-xl font-bold text-white">How We Teach</h3>
              <p className="text-gray-400 mt-3 leading-relaxed max-w-2xl">
                We teach through a studio-style, project-based model where
                students learn by building. Each cohort works in small teams with
                clear weekly milestones, structured mentoring, and frequent
                technical reviews. Our consistent workflow helps students develop
                hands-on competence and the ability to document decisions and
                communicate results with clarity.
              </p>
            </div>
          </div>
        </div>

        {/* Block 2: Wide image left + narrow text right */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 mt-20 items-center">
          <div className="relative aspect-[3/2] rounded-lg overflow-hidden">
            <Image
              src="/media/images/programs/ai-camp/ai-camp-HB8A5065.jpg"
              alt="Students discussing AI ethics and integrity"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Ethics &amp; Integrity
            </h3>
            <p className="text-gray-400 mt-3 leading-relaxed">
              We hold a high bar for safety, academic honesty, and responsible
              technology use. Students are taught to cite sources properly,
              document AI-assisted work transparently, and maintain design logs
              that can be reviewed through demonstrations and Q&amp;A. In the
              workshop, we enforce risk-tiered tool training and supervision,
              allowing students to build ambitious projects while learning
              professional standards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
