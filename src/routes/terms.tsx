import { createFileRoute } from "@tanstack/react-router";
import { PageHeading } from "@/components/record";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Mishkan Protocol" },
      {
        name: "description",
        content:
          "Terms of use for Mishkan Protocol: deliberation is advisory and not legally binding.",
      },
      { property: "og:title", content: "Terms — Mishkan Protocol" },
      {
        property: "og:description",
        content: "Deliberation on Mishkan Protocol is advisory and not legally binding.",
      },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageHeading
        eyebrow="Legal"
        title="Terms"
        lede="Mishkan Protocol is open-source software provided as a public good, without warranty."
      />
      <div className="max-w-2xl space-y-5 py-10 text-sm leading-relaxed text-muted-foreground">
        <p>
          Records published through the protocol reflect the deliberation of the communities
          that produced them. They are advisory and not legally binding, and they do not
          represent official Mishkan Protocol positions.
        </p>
        <p>
          Community discussion is unmoderated in real time. Participants are responsible for
          the content they publish and for their own compliance with applicable law.
        </p>
      </div>
    </div>
  );
}
