const VIDEOS = [
  {
    src: "https://player.vimeo.com/video/1117749184?badge=0&byline=0&h=c1bb956d04&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1",
    title: "Ithaca EV team visits Honda production line",
    caption:
      "Students from the Ithaca EV project team visited Honda's production line to learn about AI in car manufacturing at Honda Canada.",
  },
  {
    src: "https://player.vimeo.com/video/1118090619?badge=0&byline=0&h=b985930d23&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1",
    title: "EV program hands-on workshop experience",
    caption:
      "Students in the EV program gained hands-on experience working in the workshop.",
  },
  {
    src: "https://player.vimeo.com/video/1118510980?badge=0&byline=0&h=86cf6488c8&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1",
    title: "Student interview with Dr. Peter Teertstra",
    caption:
      "Students interviewed Dr. Peter Teertstra, a professor in the Faculty of Engineering at the University of Waterloo.",
  },
] as const;

export function StudentHighlights() {
  return (
    <section className="bg-[#111318] py-28" aria-labelledby="highlights-heading">
      <div className="max-w-[1400px] mx-auto px-6">
        <h2
          id="highlights-heading"
          className="text-2xl md:text-4xl font-bold text-white tracking-tight"
        >
          Student Highlights
        </h2>

        {/* 3-column video grid with 9:16 aspect for vertical videos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {VIDEOS.map((video) => (
            <div key={video.src}>
              <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-[#0c0e12]">
                <iframe
                  className="w-full h-full absolute inset-0"
                  src={video.src}
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  title={video.title}
                />
              </div>
              <p className="text-sm text-gray-400 mt-3">{video.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
