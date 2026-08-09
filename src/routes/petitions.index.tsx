import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeading } from "@/components/record";
import { ChainChip } from "@/components/chain-chip";
import {
  PETITIONS,
  STATUS_BADGE,
  formatDate,
  formatNumber,
  statusTone,
} from "@/lib/mishkan-data";

export const Route = createFileRoute("/petitions/")({
  head: () => ({
    meta: [
      { title: "Petitions — Mishkan Protocol" },
      {
        name: "description",
        content:
          "Member-initiated petitions routed to Council committees, each with a public resolution status.",
      },
      { property: "og:title", content: "Petitions — Mishkan Protocol" },
      {
        property: "og:description",
        content: "Member-initiated petitions and their routing and resolution status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Petitions,
});

function Petitions() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageHeading
        eyebrow="Right of initiative"
        title="Petitions"
        lede="Any member may petition the Council. Once a petition clears its signature threshold, it must be routed to a committee and answered on the record."
      />

      <div>
        {PETITIONS.map((p) => {
          const pct = Math.min(100, (p.signatures / p.threshold) * 100);
          const tone = statusTone(p.resolution);
          return (
            <Link
              key={p.id}
              to="/petitions/$petitionId"
              params={{ petitionId: p.id }}
              className="group grid grid-cols-1 gap-6 border-b border-rule py-8 transition-colors hover:bg-card md:grid-cols-[9rem_1fr_16rem] md:gap-10"
            >
              <div className="flex flex-row items-baseline gap-3 md:flex-col md:items-start md:gap-2">
                <span className="font-mono text-xs text-muted-foreground">{p.ref}</span>
                <span
                  className={`label-caps rounded-full border px-2 py-0.5 ${STATUS_BADGE[tone]}`}
                >
                  {p.resolution}
                </span>
              </div>

              <div className="max-w-2xl">
                <h2 className="text-xl leading-snug underline-offset-4 group-hover:underline md:text-2xl">
                  {p.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.note}</p>
                <p className="mt-4 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-muted-foreground">
                  <span>{p.community}</span>
                  <span aria-hidden>·</span>
                  <ChainChip chain={p.chain} />
                  <span aria-hidden>·</span>
                  <span>routed to {p.routedTo}</span>
                  <span aria-hidden>·</span>
                  <span>filed {formatDate(p.filed)}</span>
                </p>
              </div>

              <div className="md:pt-1">
                <div className="h-1.5 w-full bg-muted">
                  <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2.5 font-mono text-[11px] text-muted-foreground">
                  <span className="text-foreground">{formatNumber(p.signatures)}</span> of{" "}
                  {formatNumber(p.threshold)} signatures
                </p>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground group-hover:text-foreground">
                  Read petition →
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
