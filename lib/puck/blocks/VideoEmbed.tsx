import type { ComponentConfig } from "@measured/puck";

interface VideoEmbedProps {
  videoUrl: string;
  heading: string;
  aspectRatio: string;
}

function getEmbedUrl(url: string): string {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return url;
}

export const VideoEmbed: ComponentConfig<VideoEmbedProps> = {
  label: "Vidéo",
  fields: {
    videoUrl: { type: "text", label: "URL de la vidéo (YouTube / Vimeo)" },
    heading: { type: "text", label: "Titre (optionnel)" },
    aspectRatio: {
      type: "select",
      label: "Format",
      options: [
        { label: "16:9", value: "16/9" },
        { label: "4:3", value: "4/3" },
        { label: "1:1", value: "1/1" },
      ],
    },
  },
  defaultProps: {
    videoUrl: "",
    heading: "",
    aspectRatio: "16/9",
  },
  render: ({ videoUrl, heading, aspectRatio }) => (
    <section className="px-6 py-16">
      <div className="max-w-4xl mx-auto">
        {heading && (
          <h2 className="text-3xl font-display font-bold text-center mb-8">{heading}</h2>
        )}
        {videoUrl ? (
          <div
            className="relative w-full overflow-hidden rounded-2xl bg-black"
            style={{ aspectRatio }}
          >
            <iframe
              src={getEmbedUrl(videoUrl)}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={heading || "Vidéo"}
            />
          </div>
        ) : (
          <div
            className="w-full rounded-2xl bg-gray-900 flex items-center justify-center text-gray-600"
            style={{ aspectRatio }}
          >
            Collez une URL YouTube ou Vimeo
          </div>
        )}
      </div>
    </section>
  ),
};
