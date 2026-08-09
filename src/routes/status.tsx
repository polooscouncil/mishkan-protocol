import { createFileRoute } from "@tanstack/react-router";
import { PageHeading } from "@/components/record";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Status — Mishkan Protocol" },
      {
        name: "description",
        content:
          "Service status and changelog for Mishkan Protocol, the open-source community deliberation record.",
      },
      { property: "og:title", content: "Status — Mishkan Protocol" },
      {
        property: "og:description",
        content: "Service status and changelog for Mishkan Protocol.",
      },
    ],
  }),
  component: Status,
});

function Status() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageHeading
        eyebrow="Operations"
        title="Status"
        lede="Uptime and a running changelog of protocol releases will be published here."
      />
      <p className="py-12 font-mono text-sm text-muted-foreground">Status page coming soon.</p>
    </div>
  );
}
