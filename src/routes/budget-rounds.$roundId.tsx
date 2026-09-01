import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { STATUS_BADGE, formatDate, formatNumber } from "@/lib/mishkan-data";
import { shortAddress, useWallet } from "@/lib/wallet";
import {
  PROPOSAL_STATUS_LABEL,
  PROPOSAL_STATUS_TONE,
  ROUND_STATUS_LABEL,
  ROUND_STATUS_TONE,
  budgetProposalsQuery,
  budgetRoundQuery,
  budgetVotesQuery,
  castBudgetVote,
  formatAmount,
  setRoundStatus,
  submitBudgetProposal,
  type BudgetRoundStatus,
} from "@/lib/budget";

export const Route = createFileRoute("/budget-rounds/$roundId")({
  head: () => ({
    meta: [
      { title: "Budget round — Mishkan Protocol" },
      {
        name: "description",
        content:
          "Round detail: total budget, member funding proposals ranked by endorsement, and the public allocation record.",
      },
      { property: "og:title", content: "Budget round — Mishkan Protocol" },
      {
        property: "og:description",
        content: "Funding proposals ranked by token-holder endorsement.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoundDetail,
  errorComponent: () => (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm text-muted-foreground">This budget round could not be loaded.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm text-muted-foreground">Budget round not found.</p>
    </div>
  ),
});

function RoundDetail() {
  const { roundId } = Route.useParams();
  const qc = useQueryClient();
  const { address } = useWallet();
  const wallet = address?.toLowerCase() ?? null;

  const { data: round } = useSuspenseQuery(budgetRoundQuery(roundId));
  const { data: proposals } = useSuspenseQuery(budgetProposalsQuery(roundId));
  const { data: votes } = useSuspenseQuery(budgetVotesQuery(roundId));

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["budget-round", roundId] });
    void qc.invalidateQueries({ queryKey: ["budget-proposals", roundId] });
    void qc.invalidateQueries({ queryKey: ["budget-votes", roundId] });
    void qc.invalidateQueries({ queryKey: ["budget-rounds"] });
  };

  const vote = useMutation({
    mutationFn: (proposalId: string) =>
      castBudgetVote({ roundId, proposalId, wallet: wallet! }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const propose = useMutation({
    mutationFn: () =>
      submitBudgetProposal({
        roundId,
        wallet: wallet!,
        title,
        description,
        requestedAmount: Number(amount || 0),
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setAmount("");
      setShowForm(false);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (status: BudgetRoundStatus) => setRoundStatus(roundId, status),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  if (!round) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm text-muted-foreground">Budget round not found.</p>
      </div>
    );
  }

  const myVote = wallet ? votes.find((v) => v.voter_wallet_address.toLowerCase() === wallet) : null;
  const votingOpen = round.status === "open";
  const totalRequested = proposals.reduce((sum, p) => sum + p.requested_amount, 0);
  const totalEndorsements = proposals.reduce((sum, p) => sum + p.vote_count, 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Link
        to="/budget-rounds"
        className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
      >
        ← All budget rounds
      </Link>

      <header className="mt-6 border-b border-rule pb-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            BR-{round.id.slice(0, 4).toUpperCase()}
          </span>
          <span
            className={`label-caps rounded-full border px-2 py-0.5 ${STATUS_BADGE[ROUND_STATUS_TONE[round.status]]}`}
          >
            {ROUND_STATUS_LABEL[round.status]}
          </span>
        </div>
        <h1 className="mt-4 text-4xl leading-[1.1] md:text-5xl">{round.title}</h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">{round.description}</p>

        <dl className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
          <Stat label="Total budget" value={formatAmount(round.total_budget_amount, round.currency)} />
          <Stat label="Requested" value={formatAmount(totalRequested, round.currency)} />
          <Stat label="Proposals" value={formatNumber(proposals.length)} />
          <Stat label="Endorsements" value={formatNumber(totalEndorsements)} />
        </dl>
        <p className="mt-6 font-mono text-[11px] text-muted-foreground">
          {round.community_name ?? "Unassigned council"} · voting{" "}
          {formatDate(round.voting_start_date)} — {formatDate(round.voting_end_date)}
        </p>
      </header>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="label-caps text-muted-foreground">Proposals by endorsement</h2>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setShowForm((s) => !s);
            }}
            disabled={!wallet}
            title={wallet ? undefined : "Connect a wallet to submit a proposal"}
            className="border border-foreground bg-foreground px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            {showForm ? "Cancel" : "Submit proposal"}
          </button>
        </div>

        {!wallet ? (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            Connect your wallet in the header to submit a proposal or endorse one.
          </p>
        ) : (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            Acting as {shortAddress(wallet)}
            {myVote ? " · you have already endorsed a proposal in this round" : ""}
          </p>
        )}

        {showForm && wallet ? (
          <form
            className="mt-6 space-y-4 border border-rule bg-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              propose.mutate();
            }}
          >
            <Field label="Title">
              <input
                required
                maxLength={160}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-rule bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Description">
              <textarea
                required
                rows={5}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-rule bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label={`Requested amount (${round.currency})`}>
              <input
                required
                type="number"
                min={0}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-rule bg-background px-3 py-2 font-mono text-sm"
              />
            </Field>
            <button
              type="submit"
              disabled={propose.isPending}
              className="border border-foreground px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
            >
              {propose.isPending ? "Filing…" : "File proposal"}
            </button>
          </form>
        ) : null}

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

        <div className="mt-4">
          {proposals.length === 0 ? (
            <p className="border-b border-rule py-8 text-sm text-muted-foreground">
              No proposals have been filed in this round yet.
            </p>
          ) : (
            proposals.map((p) => {
              const share = totalEndorsements === 0 ? 0 : (p.vote_count / totalEndorsements) * 100;
              const voted = myVote?.proposal_id === p.id;
              return (
                <article
                  key={p.id}
                  className="grid grid-cols-1 gap-6 border-b border-rule py-8 md:grid-cols-[1fr_16rem] md:gap-10"
                >
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`label-caps rounded-full border px-2 py-0.5 ${STATUS_BADGE[PROPOSAL_STATUS_TONE[p.status]]}`}
                      >
                        {PROPOSAL_STATUS_LABEL[p.status]}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {formatAmount(p.requested_amount, round.currency)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl leading-snug md:text-2xl">{p.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>
                    <p className="mt-4 font-mono text-[11px] text-muted-foreground">
                      filed by {shortAddress(p.proposer_wallet_address)} ·{" "}
                      {formatDate(p.created_at)}
                    </p>
                  </div>

                  <div className="md:pt-1">
                    <div className="h-1.5 w-full bg-muted">
                      <div className="h-full bg-foreground" style={{ width: `${share}%` }} />
                    </div>
                    <p className="mt-2.5 font-mono text-[11px] text-muted-foreground">
                      <span className="text-foreground">{formatNumber(p.vote_count)}</span>{" "}
                      endorsements
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        vote.mutate(p.id);
                      }}
                      disabled={!wallet || !!myVote || !votingOpen || vote.isPending}
                      title={
                        !wallet
                          ? "Connect a wallet to vote"
                          : !votingOpen
                            ? "Voting is not open for this round"
                            : myVote
                              ? "You have already voted in this round"
                              : undefined
                      }
                      className="mt-4 w-full border border-foreground px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {voted ? "Your endorsement" : "Endorse"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="mt-14 border border-rule bg-card p-6">
        <h2 className="label-caps text-muted-foreground">Treasury controls</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Placeholder for the Phase 2c fund-release trigger. No funds move on-chain; the status
          below is a manual record kept by the treasury committee.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {(["draft", "open", "closed", "funds_released"] as BudgetRoundStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => statusMut.mutate(s)}
              disabled={statusMut.isPending || round.status === s}
              className={`border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors disabled:opacity-50 ${
                round.status === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-rule hover:bg-muted"
              }`}
            >
              {ROUND_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-caps text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-base text-foreground">{value}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-caps text-muted-foreground">{label}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
