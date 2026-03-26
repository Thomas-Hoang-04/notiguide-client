import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NotiGuide",
    short_name: "NotiGuide",
    description: "Join the queue and track your ticket status",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/icons/notiguide-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/notiguide-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/notiguide-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
