import { createFileRoute } from "@tanstack/react-router";
import { PageHeading } from "@/components/record";
import { CHAINS, UPCOMING_CHAINS } from "@/lib/mishkan-data";

export const Route = createFileRoute("/vision")({
  head: () => ({
    meta: [
      { title: "Vision — Mishkan Protocol" },
      {
        name: "description",
        content:
          "Open-source, public-good infrastructure for community governance. Bring your own token, deploy your own Council.",
      },
      { property: "og:title", content: "Vision — Mishkan Protocol" },
      {
        property: "og:description",
        content:
          "Open-source, public-good infrastructure for community governance. Bring your own token, deploy your own Council.",
      },
    ],
  }),
  component: Vision,
});

const PRINCIPLES = [
  {
    n: "01",
    title: "Public-good infrastructure",
    body: "Mishkan Protocol is open-source infrastructure for community governance, not a product with a native token. There is no sale, no emissions schedule, and no treasury that might benefit from the outcome of a vote.",
  },
  {
    n: "02",
    title: "Bring your own token",
    body: "Any community on BNB Chain, Ethereum, or (soon) Stellar can deploy its own Council. Each instance is scoped to one community's token. The protocol does not custody funds or hold admin keys.",
  },
  {
    n: "03",
    title: "One holder, one vote",
    body: "Membership is verified by token balance, but voting weight is not proportional to holdings. A holder with the minimum balance has the same voice as the largest holder. Balance size does not multiply influence.",
  },
  {
    n: "04",
    title: "The record is the product",
    body: "Polls, disputes, petitions, and resolutions form a permanent, append-only record. The goal is legible, auditable deliberation that can be reviewed by anyone — including people who were not present when the vote occurred.",
  },
];

function Vision() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageHeading
        eyebrow="Mission"
        title="Infrastructure for governing in public"
        lede="Mishkan Protocol is open-source, public-good infrastructure for community governance. Communities bring their own token and deploy their own Council."
      />

      <section className="grid gap-x-16 gap-y-0 py-4 lg:grid-cols-[9rem_1fr]">
        {PRINCIPLES.map((p) => (
          <div key={p.n} className="contents">
            <p className="border-b border-rule pt-8 font-mono text-xs text-muted-foreground lg:pb-8">
              {p.n}
            </p>
            <div className="border-b border-rule pb-8 pt-3 lg:pt-8">
              <h2 className="max-w-xl text-2xl leading-snug">{p.title}</h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {p.body}
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="py-12">
        <h2 className="text-2xl">Supported chains</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Any EVM chain can be added with config only, no new code — this list will keep growing.
          Balance reads, snapshotting, and record anchoring run through one shared adapter, so a
          community on a new EVM network needs a chain entry and nothing else.
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-px border border-rule bg-rule md:grid-cols-3">
          {CHAINS.map((c) => (
            <li
              key={c.id}
              className="flex items-baseline justify-between gap-3 bg-background px-4 py-5"
            >
              <span className="flex min-w-0 items-baseline gap-2 text-sm">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: c.accent }}
                />
                <span className="truncate">{c.name}</span>
              </span>
              <span className="label-caps shrink-0 text-muted-foreground">{c.short}</span>
            </li>
          ))}
          {UPCOMING_CHAINS.map((c) => (
            <li
              key={c.id}
              className="flex items-baseline justify-between gap-3 bg-background px-4 py-5"
            >
              <span className="flex min-w-0 items-baseline gap-2 text-sm text-muted-foreground">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full border border-rule"
                  style={{ backgroundColor: "transparent" }}
                />
                <span className="truncate">{c.name}</span>
              </span>
              <span className="label-caps shrink-0 rounded-full border border-pending/40 bg-pending/12 px-2 py-0.5 text-pending">
                Coming soon
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Stellar is not live. It is non-EVM — a different wallet and RPC model — so it requires a
          separate adapter rather than a configuration entry. The same is true of any future
          non-EVM chain: those are real engineering work, and we will not claim otherwise.
        </p>
      </section>

      <section className="max-w-2xl rule-top py-12">
        <h2 className="text-2xl">Roadmap</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          The current MVP uses simple one-holder-one-vote polling for polls, disputes, and
          petitions. The long-term direction is futarchy: ratifying decisions through conditional
          prediction markets — "vote on values, bet on beliefs" — rather than simple polling. This
          is future scope and is not implemented in the current release.
        </p>
      </section>

      <section className="max-w-2xl rule-top py-12">
        <h2 className="text-2xl">Source and license</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Mishkan Protocol is released under the MIT/Apache-2.0 license. The source code is
          available on{" "}
          <a
            href="https://github.com/mishkanprotocol/mishkan"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          .
        </p>
      </section>

      <section className="max-w-2xl rule-top py-12">
        <h2 className="text-2xl">What we will not build</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          No token sale. No points programme. No trading surface, price chart, or speculative
          incentive layered onto a deliberative body. Governance that pays to participate stops
          being governance.
        </p>
      </section>
    </div>
  );
}
