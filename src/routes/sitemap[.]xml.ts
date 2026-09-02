import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { PETITIONS } from "@/lib/mishkan-data";

const BASE_URL = "https://mishkanprotocol2.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/archive", changefreq: "weekly", priority: "0.8" },
          { path: "/petitions", changefreq: "weekly", priority: "0.8" },
          { path: "/budget-rounds", changefreq: "weekly", priority: "0.7" },
          { path: "/feed", changefreq: "daily", priority: "0.7" },
          { path: "/vision", changefreq: "monthly", priority: "0.6" },
          { path: "/submit", changefreq: "monthly", priority: "0.5" },
          { path: "/status", changefreq: "weekly", priority: "0.4" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          ...PETITIONS.map((p) => ({
            path: `/petitions/${p.id}`,
            changefreq: "weekly" as const,
            priority: "0.7",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
