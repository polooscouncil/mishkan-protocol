import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { PageHeading } from "@/components/record";
import { STATUS_BADGE, formatDate, formatNumber } from "@/lib/mishkan-data";
import { shortAddress, useWallet } from "@/lib/wallet";
import { councilsQuery } from "@/lib/db";
import type { BudgetEligibilityMode, BudgetRound } from "@/lib/budget";
import {
  ROUND_STATUS_LABEL,
  ROUND_STATUS_TONE,
  budgetRoundsQuery,
  createBudgetRound,
  formatAmount,
  parseAllowlist,
} from "@/lib/budget";


export const Route = createFileRoute("/budget-rounds/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(budgetRoundsQuery);
    context.queryClient.ensureQueryData(councilsQuery);
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
      <HowItWorks />
      <p className="mt-4">
        <Link
          to="/budget-rounds/transparency"
          className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          View the public transparency ledger →
        </Link>
      </p>

      <NewRoundForm />


      <Section title="Active rounds" rounds={active} empty="No round is currently open." />
      <Section title="Past rounds" rounds={past} empty="No round has closed yet." />
    </div>
  );
}

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Propose",
    body: "Any member submits a funding proposal with a requested amount from the round's pool.",
  },
  {
    step: "02",
    title: "Endorse",
    body: "Every eligible wallet endorses one proposal per round — one holder, one vote.",
  },
  {
    step: "03",
    title: "Release",
    body: "When voting closes, the winning proposal is paid through an on-chain treasury confirmed by a public event.",
  },
  {
    step: "04",
    title: "Verify",
    body: "Anyone can audit the full record — no wallet needed — on the Transparency ledger.",
  },
] as const;

function HowItWorks() {
  return (
    <section className="mt-12 border border-rule">
      <h2 className="label-caps border-b border-rule bg-card px-6 py-4 text-muted-foreground">
        How budget rounds work
      </h2>
      <ol className="grid grid-cols-1 gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS.map((s) => (
          <li key={s.step} className="bg-background px-6 py-6">
            <span
              aria-hidden
              className="flex size-9 items-center justify-center border border-foreground font-serif text-sm"
            >
              {s.step}
            </span>
            <h3 className="mt-4 font-serif text-lg tracking-tight">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function NewRoundForm() {
  const qc = useQueryClient();
  const { address } = useWallet();
  const wallet = address?.toLowerCase() ?? null;
  const { data: councils } = useSuspenseQuery(councilsQuery);

  const [open, setOpen] = useState(false);
  const [communityId, setCommunityId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [startDate, setStartDate] = useState(todayPlus(0));
  const [endDate, setEndDate] = useState(todayPlus(14));
  const [mode, setMode] = useState<BudgetEligibilityMode>("open");
  const [allowlistRaw, setAllowlistRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseAllowlist(allowlistRaw), [allowlistRaw]);
  const selectedCouncil = communityId || councils[0]?.id || "";

  const create = useMutation({
    mutationFn: () =>
      createBudgetRound({
        wallet: wallet!,
        communityId: selectedCouncil,
        title,
        description,
        totalBudgetAmount: Number(amount || 0),
        currency: currency.trim().toUpperCase() || "USD",
        votingStartDate: new Date(startDate).toISOString(),
        votingEndDate: new Date(endDate).toISOString(),
        eligibilityMode: mode,
        allowlist: parsed.addresses,
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setAmount("");
      setAllowlistRaw("");
      setMode("open");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["budget-rounds"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const allowlistBlocked = mode === "allowlist" && parsed.addresses.length === 0;

  return (
    <section className="mt-12 border border-rule bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="label-caps text-muted-foreground">Open a new round</h2>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {wallet
              ? `Acting as ${shortAddress(wallet)}`
              : "Connect your wallet in the header to open a round."}
          </p>
        </div>
        <button
          type="button"
          disabled={!wallet}
          onClick={() => {
            setError(null);
            setOpen((s) => !s);
          }}
          className="border border-foreground bg-foreground px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          {open ? "Cancel" : "New round"}
        </button>
      </div>

      {open && wallet ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (allowlistBlocked) {
              setError("Add at least one valid address to the allowlist, or choose open voting.");
              return;
            }
            create.mutate();
          }}
        >
          <FormField label="Council">
            <select
              required
              value={selectedCouncil}
              onChange={(e) => setCommunityId(e.target.value)}
              className="w-full border border-rule bg-background px-3 py-2 text-sm"
            >
              {councils.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.community_name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Title">
            <input
              required
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-rule bg-background px-3 py-2 text-sm"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              required
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-rule bg-background px-3 py-2 text-sm"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Total budget">
              <input
                required
                type="number"
                min={0}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-rule bg-background px-3 py-2 font-mono text-sm"
              />
            </FormField>
            <FormField label="Currency">
              <input
                required
                maxLength={8}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full border border-rule bg-background px-3 py-2 font-mono text-sm uppercase"
              />
            </FormField>
            <FormField label="Voting opens">
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-rule bg-background px-3 py-2 font-mono text-sm"
              />
            </FormField>
            <FormField label="Voting closes">
              <input
                required
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-rule bg-background px-3 py-2 font-mono text-sm"
              />
            </FormField>
          </div>

          <fieldset>
            <legend className="label-caps text-muted-foreground">Who may vote</legend>
            <div className="mt-3 flex flex-col gap-2">
              {(
                [
                  ["open", "Open to all community members"],
                  ["allowlist", "Restricted to a specific list"],
                ] as [BudgetEligibilityMode, string][]
              ).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="eligibility-mode"
                    value={value}
                    checked={mode === value}
                    onChange={() => setMode(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {mode === "allowlist" ? (
            <FormField label="Allowlisted wallets (one address per line)">
              <textarea
                rows={6}
                value={allowlistRaw}
                onChange={(e) => setAllowlistRaw(e.target.value)}
                placeholder={"0x…\n0x…"}
                className="w-full border border-rule bg-background px-3 py-2 font-mono text-xs"
              />
              <span className="mt-2 block font-mono text-[11px] text-muted-foreground">
                {formatNumber(parsed.addresses.length)} valid address
                {parsed.addresses.length === 1 ? "" : "es"}
              </span>
              {parsed.errors.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {parsed.errors.map((err) => (
                    <li
                      key={`${err.line}-${err.value}`}
                      className="font-mono text-[11px] text-destructive"
                    >
                      Line {err.line}: {err.reason}
                    </li>
                  ))}
                </ul>
              ) : null}
            </FormField>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={create.isPending}
            className="border border-foreground px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
          >
            {create.isPending ? "Opening…" : "Open round"}
          </button>
        </form>
      ) : null}
    </section>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-caps text-muted-foreground">{label}</span>
      <span className="mt-2 block">{children}</span>
    </label>
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
                  <p className="mt-3">
                    <span className="label-caps rounded-full border border-rule px-2 py-0.5 text-muted-foreground">
                      {r.eligibility_mode === "allowlist"
                        ? `${formatNumber(r.eligible_count)} eligible voters`
                        : "Open to all members"}
                    </span>
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
