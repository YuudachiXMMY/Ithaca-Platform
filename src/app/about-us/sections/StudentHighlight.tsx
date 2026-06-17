export function StudentHighlight() {
  return (
    <section className="bg-[#0c0e12] py-28" aria-labelledby="spotlight-heading">
      <div className="max-w-[1400px] mx-auto px-6">
        <h2
          id="spotlight-heading"
          className="text-2xl md:text-4xl font-bold text-white tracking-tight"
        >
          Student Spotlight
        </h2>

        {/* Wide video left (3fr) + compact text right (2fr) */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 items-center mt-10">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-[#111318]">
            <iframe
              className="w-full h-full absolute inset-0"
              src="https://player.vimeo.com/video/1118098299?badge=0&byline=0&h=7bcd85eebf&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              title="Andy Song interviewing Scotiabank executives"
            />
          </div>

          <div>
            <p className="text-lg font-bold text-white">Andy Song</p>
            <p className="text-sm font-medium text-[#ccdef0] mt-1">
              AI Pioneers Interview Project
            </p>
            <p className="text-gray-400 mt-4 leading-relaxed">
              Andy interviewed Mr. Carlos Orencio Horta, Director of AI at
              Scotiabank, and Mr. Tanaby Zibamanzar, Director of Data Analytics.
              Andy graduated from high school in June 2025 and began his studies
              at Princeton University in September 2025.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
