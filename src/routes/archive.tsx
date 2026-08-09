import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageHeading } from "@/components/record";
import { DocketRow } from "@/components/docket-row";
import { archiveQuery } from "@/lib/db";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "Archive — Mishkan Protocol" },
      {
        name: "description",
        content:
          "Resolved polls, disputes, and proposals. A permanent, public record of every Council decision.",
      },
      { property: "og:title", content: "Archive — Mishkan Protocol" },
      {
        property: "og:description",
        content: "A permanent, public record of every resolved Council item.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(archiveQuery),
  component: Archive,
  errorComponent: () => (
    <div className="mx-auto max-w-6xl px-6 py-16 text-sm text-muted-foreground">
      The archive could not be loaded. Please try again.
    </div>
  ),
});

function Archive() {
  const { data: items } = useSuspenseQuery(archiveQuery);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageHeading
        eyebrow="Permanent record"
        title="Archive"
        lede="Resolved items are never deleted or amended. Each entry preserves its tally, turnout, and the Council's written resolution."
      />

      <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-rule py-6 font-mono text-[11px] text-muted-foreground">
        <span>{items.length} entries</span>
        <span>Mirrored to content-addressed storage</span>
      </div>

      <div>
        {items.length === 0 ? (
          <p className="py-12 text-sm text-muted-foreground">No resolved items yet.</p>
        ) : (
          items.map((item) => <DocketRow key={item.id} item={item} votable={false} />)
        )}
      </div>
    </div>
  );
}
