import { createFileRoute } from "@tanstack/react-router";
import { PageHeading } from "@/components/record";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Mishkan Protocol" },
      {
        name: "description",
        content:
          "How Mishkan Protocol handles data: public records, wallet addresses, and no accounts.",
      },
      { property: "og:title", content: "Privacy — Mishkan Protocol" },
      {
        property: "og:description",
        content: "Public records, wallet addresses, and no accounts.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageHeading
        eyebrow="Data"
        title="Privacy"
        lede="The protocol keeps a public record. Everything written to it is intended to be read by anyone."
      />
      <div className="max-w-2xl space-y-5 py-10 text-sm leading-relaxed text-muted-foreground">
        <p>
          There are no accounts. Participation is identified by the wallet address you connect,
          which is stored alongside the items you file, the votes you sign, and the comments you
          post.
        </p>
        <p>
          Reading the docket and archive requires no wallet and no identification. Records,
          once written, are permanent by design and are not removed on request.
        </p>
      </div>
    </div>
  );
}
