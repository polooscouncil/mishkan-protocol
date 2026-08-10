import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DocketRow } from "@/components/docket-row";
import { docketQuery, socialFeedQuery, statsQuery } from "@/lib/db";
import { KIND_LABEL, formatNumber, type ItemKind } from "@/lib/mishkan-data";
import { useWallet } from "@/lib/wallet";
import { useActiveCouncil } from "@/lib/active-council";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Docket — Mishkan Protocol" },
      {
        name: "description",
        content:
          "Read the Docket: open community polls, dispute cases, and governance proposals currently before the Council, with live tallies.",
      },
      { property: "og:title", content: "The Docket — Mishkan Protocol" },
      { property: "og:url", content: "https://mishkanprotocol2.lovable.app/" },
      {
        property: "og:description",
        content:
          "Open polls, disputes, and proposals under active deliberation right now — follow each tally as members sign their votes.",
      },
    ],
    links: [{ rel: "canonical", href: "https://mishkanprotocol2.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [...FAQ, ...PRIMER].map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }),
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(docketQuery),

  component: Docket,
  errorComponent: () => (
    <div className="mx-auto max-w-6xl px-6 py-16 text-sm text-muted-foreground">
      The docket could not be loaded. Please try again.
    </div>
  ),
});

const FAQ = [
  {
    q: "What does one holder, one vote mean?",
    a: "Voting weight is not proportional to balance. Any wallet that meets the community's minimum holding requirement casts exactly one vote on an item, so a large holder carries no more weight in the record than a small one.",
  },
  {
    q: "What are signal points?",
    a: "Signal points are a non-transferable record of participation — items filed, votes signed, petitions supported. They are a measure of presence in the deliberation, not a claim on anything.",
  },
  {
    q: "Can signal points be traded or sold?",
    a: "No. Signal points are bound to the wallet that earned them, cannot be transferred, and have no price. Mishkan Protocol issues no token of any kind.",
  },
];

const PRIMER = [
  {
    q: "How does an item reach the docket?",
    a: "Any member of a community can open a poll, a dispute, or a proposal. The item is written into the public record the moment it is filed, and it appears on the docket in the order it was opened.",
  },
  {
    q: "How is voting conducted?",
    a: "A member connects a wallet, the protocol checks the community's membership requirement, and the vote is recorded as a signed message. Signing is free — nothing is transacted and no fee is paid.",
  },
  {
    q: "What happens when deliberation closes?",
    a: "The item is resolved with a written rationale and moved to the archive. Nothing is deleted: the tally, the rationale, and the discussion remain readable permanently.",
  },
  {
    q: "Where do petitions fit?",
    a: "A petition is a member-initiated request that, once it clears its threshold, must be routed to the relevant body and answered on the record with a resolution status.",
  },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "poll", label: KIND_LABEL.poll },
  { key: "dispute", label: KIND_LABEL.dispute },
  { key: "proposal", label: KIND_LABEL.proposal },
] as const;

function Hero() {
  const wallet = useWallet();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="hero-wash -mx-6 border-b border-rule px-6 pb-14 pt-10 lg:mx-0">
      <p className="label-caps text-muted-foreground">Public record · Open deliberation</p>
      <h1 className="mt-5 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
        Where communities deliberate.
      </h1>
      <p className="mt-6 max-w-2xl border-l-2 border-rule pl-4 font-serif text-lg italic leading-relaxed text-muted-foreground">
        Looking ahead: we are exploring futarchy as an advisory signal.
      </p>
      <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Polls, disputes, and proposals opened by the community. Connect a wallet holding the
        community's token to cast a vote — one holder, one vote, regardless of balance.
      </p>

      <div className="mt-7 max-w-2xl">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {FAQ.map((f) => (
            <button
              key={f.q}
              type="button"
              onClick={() => setOpen((cur) => (cur === f.q ? null : f.q))}
              className={`border-b py-0.5 text-left font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                open === f.q
                  ? "border-foreground text-foreground"
                  : "border-rule text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.q}
            </button>
          ))}
        </div>
        {open ? (
          <p className="mt-4 border-l-2 border-foreground pl-4 text-sm leading-relaxed text-foreground">
            {FAQ.find((f) => f.q === open)?.a}
          </p>
        ) : null}
      </div>

      <p className="mt-8 font-mono text-[11px] text-muted-foreground">
        {wallet.address
          ? `Connected ${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)} — you can submit and vote where you hold the community's token.`
          : "Not connected — anyone can read the docket and archive. Connect a wallet to submit or vote."}
      </p>
    </section>
  );
}

function StatsBar() {
  const { data } = useQuery(statsQuery);
  const cells = [
    ["Verified members", data?.members],
    ["Votes cast", data?.votes],
    ["Proposals resolved", data?.resolved],
    ["Petitions dispatched", data?.petitions],
  ] as const;

  return (
    <dl className="grid grid-cols-2 border-b border-rule md:grid-cols-4">
      {cells.map(([label, value]) => (
        <div
          key={label}
          className="border-l border-rule px-5 py-7 first:border-l-0 md:first:pl-0"
        >
          <dt className="label-caps text-muted-foreground">{label}</dt>
          <dd className="mt-2 font-serif text-3xl">
            {value === undefined ? "—" : formatNumber(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Primer() {
  return (
    <section className="border-b border-rule py-12">
      <h2 className="text-2xl md:text-3xl">How Mishkan Protocol works</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        A single cycle, in plain language — the same on every chain and in every community.
      </p>
      <Accordion type="single" collapsible className="mt-6 max-w-3xl">
        {PRIMER.map((p) => (
          <AccordionItem key={p.q} value={p.q} className="border-rule">
            <AccordionTrigger className="text-left text-base hover:no-underline">
              {p.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {p.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function shortWallet(w: string) {
  return `${w.slice(0, 6)}…${w.slice(-4)}`;
}

function FeedSidebar() {
  const { council } = useActiveCouncil();
  const { data: posts = [], isLoading } = useQuery(socialFeedQuery(council?.id ?? null));
  const recent = posts.slice(0, 5);

  return (
    <aside className="mt-12 lg:sticky lg:top-28 lg:mt-0 lg:self-start">
      <div className="border-b border-rule pb-4">
        <p className="label-caps text-muted-foreground">Community</p>
        <h2 className="mt-2 text-xl">Feed</h2>
      </div>


      <div className="divide-y divide-rule">
        {isLoading ? (
          <p className="py-6 font-mono text-[11px] text-muted-foreground">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No posts yet. Be the first to write something.
          </p>
        ) : (
          recent.map((post) => (
            <article key={post.id} className="py-4">
              <p className="flex items-center justify-between gap-3 font-mono text-[11px] text-muted-foreground">
                <span className="text-foreground">{shortWallet(post.author_wallet)}</span>
                <span>
                  {new Date(post.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </p>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {post.content}
              </p>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                {post.reply_count} {post.reply_count === 1 ? "reply" : "replies"}
              </p>
            </article>
          ))
        )}
      </div>

      <Link
        to="/feed"
        className="mt-4 inline-block border-b border-rule pb-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
      >
        View all →
      </Link>
    </aside>
  );
}

function Docket() {
  const { data: items } = useSuspenseQuery(docketQuery);
  const { council } = useActiveCouncil();
  const [filter, setFilter] = useState<"all" | ItemKind>("all");

  const scoped = council ? items.filter((i) => i.council_id === council.id) : items;
  const visible = filter === "all" ? scoped : scoped.filter((i) => i.type === filter);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid items-start gap-x-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <Hero />
          <StatsBar />
          <Primer />

          <section className="pt-12">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
              <div>
                <p className="label-caps text-muted-foreground">Open items</p>
                <h2 className="mt-2 text-2xl md:text-3xl">
                  The Docket
                  {council ? (
                    <span className="text-muted-foreground"> · {council.community_name}</span>
                  ) : null}
                </h2>
              </div>
              <Link
                to="/submit"
                className="border border-foreground bg-foreground px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-85"
              >
                + Submit
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-rule py-4">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`border-b py-0.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                    filter === f.key
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                  <span className="ml-2 text-muted-foreground">
                    {f.key === "all"
                      ? scoped.length
                      : scoped.filter((i) => i.type === f.key).length}
                  </span>
                </button>
              ))}
            </div>

            <p className="border-b border-rule py-4 text-xs leading-relaxed text-muted-foreground">
              Community discussion is not moderated in real time and does not represent official
              Mishkan Protocol positions. Report inappropriate content using the flag button.
            </p>

            <div>
              {visible.length === 0 ? (
                <p className="py-12 text-sm text-muted-foreground">
                  No open items match this view. File one from the Submit page.
                </p>
              ) : (
                visible.map((item) => <DocketRow key={item.id} item={item} votable />)
              )}
            </div>
          </section>
        </div>

        <FeedSidebar />
      </div>
    </div>
  );
}

