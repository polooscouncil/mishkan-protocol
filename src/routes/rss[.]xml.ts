import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { BASE_URL, collectFeedEntries, escapeXml } from "@/lib/feed-source";

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = await collectFeedEntries();
        const now = new Date().toUTCString();

        const items = entries.map((e) =>
          [
            "  <item>",
            `    <title>${escapeXml(e.title)}</title>`,
            `    <link>${escapeXml(e.link)}</link>`,
            `    <guid isPermaLink="false">${escapeXml(e.id)}</guid>`,
            `    <category>${escapeXml(e.category)}</category>`,
            `    <pubDate>${new Date(e.updated).toUTCString()}</pubDate>`,
            `    <description>${escapeXml(e.summary)}</description>`,
            "  </item>",
          ].join("\n"),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
          "<channel>",
          "  <title>Mishkan Protocol — Docket &amp; Petitions</title>",
          `  <link>${BASE_URL}/</link>`,
          "  <description>Open polls, disputes, proposals, and petitions on the Mishkan Protocol public record.</description>",
          "  <language>en</language>",
          `  <lastBuildDate>${now}</lastBuildDate>`,
          `  <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
          ...items,
          "</channel>",
          "</rss>",
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=900",
          },
        });
      },
    },
  },
});
