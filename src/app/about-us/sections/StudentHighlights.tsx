export function StudentHighlights() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">
          Student Highlights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Video 1 */}
          <div>
            <div className="relative aspect-[9/16] rounded overflow-hidden">
              <iframe
                className="w-full h-full absolute inset-0"
                src="https://player.vimeo.com/video/1117749184?badge=0&byline=0&h=c1bb956d04&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
              />
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Students from the Ithaca EV project team visited Honda&apos;s
              production line to learn about the role of artificial intelligence
              in the car manufacturing process at Honda Canada.
            </p>
          </div>

          {/* Video 2 */}
          <div>
            <div className="relative aspect-[9/16] rounded overflow-hidden">
              <iframe
                className="w-full h-full absolute inset-0"
                src="https://player.vimeo.com/video/1118090619?badge=0&byline=0&h=b985930d23&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
              />
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Students in the EV program gained hands-on experience and working
              in the workshop
            </p>
          </div>

          {/* Video 3 */}
          <div>
            <div className="relative aspect-[9/16] rounded overflow-hidden">
              <iframe
                className="w-full h-full absolute inset-0"
                src="https://player.vimeo.com/video/1118510980?badge=0&byline=0&h=86cf6488c8&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
              />
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Students interviewed Dr. Peter Teertstra, a professor in the
              Faculty of Engineering at the University of Waterloo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
