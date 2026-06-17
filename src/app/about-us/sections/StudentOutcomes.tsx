const OUTCOMES = [
  {
    title: "Portfolio-Ready Deliverables",
    description:
      "Students graduate with tangible artifacts, including prototype demos, project reports, and presentation materials that can be showcased at school, in competitions, and for applications.",
  },
  {
    title: "Engineering & Systems Thinking",
    description:
      "From building and testing to iteration, students develop the habit of reasoning with structure, constraints, and real-world tradeoffs.",
  },
  {
    title: "AI Literacy with Responsibility",
    description:
      "Students learn to use AI tools effectively and ethically, with proper citation, process documentation, and defensible decision-making.",
  },
  {
    title: "Business & Validation Mindset",
    description:
      "Teams practice problem definition, user understanding, and basic business logic: learning how value is created and communicated.",
  },
  {
    title: "Collaboration & Leadership",
    description:
      "Through team roles and real deadlines, students build collaboration habits that traditional classroom settings often cannot replicate.",
  },
  {
    title: "Communication & Pitch Skills",
    description:
      "Students present clearly under time pressure, handle questions, and learn how to tell a coherent story from problem to solution.",
  },
] as const;

export function StudentOutcomes() {
  return (
    <section className="bg-white py-24" aria-labelledby="outcomes-heading">
      <div className="max-w-5xl mx-auto px-6">
        <h2
          id="outcomes-heading"
          className="text-3xl font-bold text-gray-900 mb-10"
        >
          Student Outcomes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {OUTCOMES.map((outcome) => (
            <div key={outcome.title}>
              <h4 className="text-base font-bold text-gray-900 mb-3 min-h-[3rem]">
                {outcome.title}
              </h4>
              <div className="bg-gray-100 aspect-[2/1] rounded mb-3" />
              <p className="text-sm text-gray-600 leading-relaxed">
                {outcome.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
