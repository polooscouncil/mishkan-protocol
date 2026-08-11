import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { BASE_URL, collectFeedEntries, escapeXml } from "@/lib/feed-source";

export const Route = createFileRoute("/atom.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = await collectFeedEntries();
        const updated = entries[0]?.updated ?? new Date().toISOString();

        const items = entries.map((e) =>
          [
            "  <entry>",
            `    <title>${escapeXml(e.title)}</title>`,
            `    <link href="${escapeXml(e.link)}" />`,
            `    <id>${escapeXml(e.id)}</id>`,
            `    <category term="${escapeXml(e.category)}" />`,
            `    <updated>${e.updated}</updated>`,
            `    <summary>${escapeXml(e.summary)}</summary>`,
            "  </entry>",
          ].join("\n"),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<feed xmlns="http://www.w3.org/2005/Atom">',
          "  <title>Mishkan Protocol — Docket &amp; Petitions</title>",
          "  <subtitle>Open polls, disputes, proposals, and petitions on the public record.</subtitle>",
          `  <id>${BASE_URL}/atom.xml</id>`,
          `  <link href="${BASE_URL}/atom.xml" rel="self" />`,
          `  <link href="${BASE_URL}/" />`,
          `  <updated>${updated}</updated>`,
          ...items,
          "</feed>",
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/atom+xml; charset=utf-8",
            "Cache-Control": "public, max-age=900",
          },
        });
      },
    },
  },
});
