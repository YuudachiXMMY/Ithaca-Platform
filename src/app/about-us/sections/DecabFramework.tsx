import Image from "next/image";

export function DecabFramework() {
  return (
    <section className="bg-white py-24" aria-labelledby="decab-heading">
      <div className="max-w-5xl mx-auto px-6">
        <h2
          id="decab-heading"
          className="text-3xl font-bold text-gray-900 mb-8"
        >
          DECAB Competency Map
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Left column */}
          <div className="md:col-span-7">
            <h4 className="text-lg font-semibold text-gray-900">
              DECAB is our competency framework for tracking growth across five
              dimensions:
            </h4>
            <ul className="mt-4 list-disc pl-6 space-y-1 text-gray-700">
              <li>
                <strong>D</strong>esign &amp; Principles
              </li>
              <li>
                <strong>E</strong>lectrical Engineering
              </li>
              <li>
                <strong>C</strong>omputer Programming
              </li>
              <li>
                <strong>A</strong>pplication of math and physics
              </li>
              <li>
                <strong>B</strong>usiness, Collaboration &amp; Communication
              </li>
            </ul>
            <p className="mt-4 text-gray-600">
              We use <strong>DECAB</strong> to set clear learning targets,
              differentiate instruction, and ensure students develop balanced
              capability: Technical Depth, Applied Reasoning, and Real-World
              Execution.
            </p>
          </div>

          {/* Right column */}
          <div className="md:col-span-5">
            <Image
              src="/media/images/programs/ai-camp/ai-camp-98d3ff7.jpg"
              alt="DECAB competency framework"
              width={256}
              height={256}
              className="aspect-square rounded object-cover w-64"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
