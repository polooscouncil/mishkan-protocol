import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChainChip } from "@/components/chain-chip";
import {
  STATUS_BADGE,
  formatDate,
  formatNumber,
  petitionById,
  statusTone,
  type Petition,
  type PetitionStage,
} from "@/lib/mishkan-data";

export const Route = createFileRoute("/petitions/$petitionId")({
  loader: ({ params }) => {
    const petition = petitionById(params.petitionId);
    if (!petition) throw notFound();
    return { petition };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Petition not found — Mishkan Protocol" }, { name: "robots", content: "noindex" }],
      };
    }
    const { petition } = loaderData;
    const title = `${petition.ref}: ${petition.title} — Mishkan Protocol`;
    const description = `${petition.community} · routed to ${petition.routedTo} · ${petition.resolution}. ${petition.note}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: PetitionDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-muted-foreground">
      No petition with that reference.{" "}
      <Link to="/petitions" className="underline underline-offset-4">
        Back to petitions
      </Link>
      .
    </div>
  ),
});

function PetitionDetail() {
  const { petition } = Route.useLoaderData() as { petition: Petition };
  const pct = Math.min(100, (petition.signatures / petition.threshold) * 100);
  const tone = statusTone(petition.resolution);
  const met = petition.signatures >= petition.threshold;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Link
        to="/petitions"
        className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        ← Petitions
      </Link>

      <header className="mt-6 border-b border-rule pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">{petition.ref}</span>
          <span className={`label-caps rounded-full border px-2 py-0.5 ${STATUS_BADGE[tone]}`}>
            {petition.resolution}
          </span>
        </div>
        <h1 className="mt-4 max-w-3xl text-3xl leading-tight md:text-4xl">{petition.title}</h1>
        <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-muted-foreground">
          <span>{petition.community}</span>
          <span aria-hidden>·</span>
          <ChainChip chain={petition.chain} />
          <span aria-hidden>·</span>
          <span>filed {formatDate(petition.filed)}</span>
        </p>
      </header>

      <section className="grid gap-10 border-b border-rule py-8 md:grid-cols-[1fr_16rem]">
        <div>
          <h2 className="label-caps text-muted-foreground">Signatures</h2>
          <div className="mt-3 h-2 w-full bg-muted">
            <div
              className={`h-full ${met ? "bg-passed" : "bg-foreground"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2.5 font-mono text-[11px] text-muted-foreground">
            <span className="text-foreground">{formatNumber(petition.signatures)}</span> of{" "}
            {formatNumber(petition.threshold)} signatures ·{" "}
            {met ? "threshold met" : `${formatNumber(petition.threshold - petition.signatures)} to go`}
          </p>
        </div>
        <div>
          <h2 className="label-caps text-muted-foreground">Committee assigned</h2>
          <p className="mt-3 text-base">{petition.routedTo}</p>
        </div>
      </section>

      <section className="border-b border-rule py-10">
        <h2 className="text-2xl">Petition text</h2>
        <div className="mt-5 max-w-2xl space-y-4">
          {petition.body.map((para: string) => (
            <p key={para.slice(0, 32)} className="text-base leading-relaxed text-muted-foreground">
              {para}
            </p>
          ))}
        </div>
      </section>

      <section className="border-b border-rule py-10">
        <h2 className="text-2xl">Timeline</h2>
        <ol className="mt-6 max-w-2xl">
          {petition.timeline.map((stage: PetitionStage) => {
            const done = stage.date !== null;
            return (
              <li key={stage.label} className="flex gap-4 border-l border-rule pb-7 pl-5 last:pb-0">
                <span
                  aria-hidden
                  className={`-ml-[1.6rem] mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    done ? "bg-passed" : "border border-rule bg-background"
                  }`}
                />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-base">{stage.label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {done ? formatDate(stage.date!) : "pending"}
                    </span>
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {stage.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="py-10">
        <h2 className="text-2xl">Resolution</h2>
        {petition.resolutionText ? (
          <p className="mt-5 max-w-2xl border-l-2 border-rule pl-4 text-base leading-relaxed">
            {petition.resolutionText}
          </p>
        ) : (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Not yet resolved. The Council's written answer will be entered here and preserved
            permanently once deliberation closes.
          </p>
        )}
      </section>
    </div>
  );
}
