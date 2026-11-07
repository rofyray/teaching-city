import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Teaching City",
    short_name: "Teaching City",
    description: "Nursing has clinicals. Now every major does.",
    start_url: "/s",
    display: "standalone",
    background_color: "#F4F5F5",
    theme_color: "#111A1F",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
