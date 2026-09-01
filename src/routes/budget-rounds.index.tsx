import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageHeading } from "@/components/record";
import { STATUS_BADGE, formatDate, formatNumber } from "@/lib/mishkan-data";
import type { BudgetRound } from "@/lib/budget";
import {
  ROUND_STATUS_LABEL,
  ROUND_STATUS_TONE,
  budgetRoundsQuery,
  formatAmount,
} from "@/lib/budget";

export const Route = createFileRoute("/budget-rounds/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(budgetRoundsQuery);
  },
  head: () => ({
    meta: [
      { title: "Budget Rounds — Mishkan Protocol" },
      {
        name: "description",
        content:
          "Open and past budget rounds: member-submitted funding proposals, one endorsement per wallet, and a public record of allocations.",
      },
      { property: "og:title", content: "Budget Rounds — Mishkan Protocol" },
      {
        property: "og:description",
        content: "Member-submitted funding proposals decided by token-holder endorsement.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BudgetRoundsPage,
  errorComponent: () => (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm text-muted-foreground">Budget rounds are unavailable right now.</p>
    </div>
  ),
});

function BudgetRoundsPage() {
  const { data: rounds } = useSuspenseQuery(budgetRoundsQuery);
  const active = rounds.filter((r) => r.status === "open" || r.status === "draft");
  const past = rounds.filter((r) => r.status === "closed" || r.status === "funds_released");

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageHeading
        eyebrow="Power of the purse"
        title="Budget Rounds"
        lede="Each round sets aside a discretionary pool. Members submit funding proposals, every wallet endorses one proposal per round, and allocations are settled on the public record."
      />

      <Section title="Active rounds" rounds={active} empty="No round is currently open." />
      <Section title="Past rounds" rounds={past} empty="No round has closed yet." />
    </div>
  );
}

function Section({
  title,
  rounds,
  empty,
}: {
  title: string;
  rounds: BudgetRound[];
  empty: string;
}) {
  return (
    <section className="mt-14">
      <h2 className="label-caps text-muted-foreground">{title}</h2>
      {rounds.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-2">
          {rounds.map((r) => {
            const tone = ROUND_STATUS_TONE[r.status];
            return (
              <Link
                key={r.id}
                to="/budget-rounds/$roundId"
                params={{ roundId: r.id }}
                className="group grid grid-cols-1 gap-6 border-b border-rule py-8 transition-colors hover:bg-card md:grid-cols-[9rem_1fr_16rem] md:gap-10"
              >
                <div className="flex flex-row items-baseline gap-3 md:flex-col md:items-start md:gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    BR-{r.id.slice(0, 4).toUpperCase()}
                  </span>
                  <span
                    className={`label-caps rounded-full border px-2 py-0.5 ${STATUS_BADGE[tone]}`}
                  >
                    {ROUND_STATUS_LABEL[r.status]}
                  </span>
                </div>

                <div className="max-w-2xl">
                  <h3 className="text-xl leading-snug underline-offset-4 group-hover:underline md:text-2xl">
                    {r.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {r.description}
                  </p>
                  <p className="mt-4 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-muted-foreground">
                    <span>{r.community_name ?? "Unassigned council"}</span>
                    <span aria-hidden>·</span>
                    <span>{formatNumber(r.proposal_count)} proposals</span>
                    <span aria-hidden>·</span>
                    <span>{formatNumber(r.vote_count)} endorsements</span>
                  </p>
                </div>

                <div className="md:pt-1">
                  <p className="font-mono text-lg text-foreground">
                    {formatAmount(r.total_budget_amount, r.currency)}
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    voting {formatDate(r.voting_start_date)} — {formatDate(r.voting_end_date)}
                  </p>
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground group-hover:text-foreground">
                    Open round →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
