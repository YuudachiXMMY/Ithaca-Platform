export function StudentHighlight() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left column: Student info */}
          <div>
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <span className="font-bold text-gray-600">A</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
              Andy Song, a student in the AI Pioneers Interview Project, was
              interviewing Mr. Carlos Orencio Horta, Director of AI at
              Scotiabank, and Mr. Tanaby Zibamanzar, Director of Data Analytics.
              Andy graduated from high school in June 2025 and began his studies
              at Princeton University in September 2025.
            </h3>
          </div>

          {/* Right column: Video */}
          <div className="relative aspect-video rounded overflow-hidden">
            <iframe
              className="w-full h-full absolute inset-0"
              src="https://player.vimeo.com/video/1118098299?badge=0&byline=0&h=7bcd85eebf&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
