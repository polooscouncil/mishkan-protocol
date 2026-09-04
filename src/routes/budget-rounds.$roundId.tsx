import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { STATUS_BADGE, formatDate, formatNumber } from "@/lib/mishkan-data";
import { shortAddress, useWallet } from "@/lib/wallet";
import {
  PROPOSAL_STATUS_LABEL,
  PROPOSAL_STATUS_TONE,
  ROUND_STATUS_LABEL,
  ROUND_STATUS_TONE,
  budgetEligibilityQuery,
  budgetProposalsQuery,
  budgetRoundQuery,
  budgetVotesQuery,
  castBudgetVote,
  formatAmount,
  setRoundStatus,
  submitBudgetProposal,
  markProposalFunded,
  recordRoundTreasury,
} from "@/lib/budget";
import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_TREASURY_CHAIN_ID,
  createRoundTreasury,
  hasTreasuryDeployment,
  isTreasuryAdmin,
  recordWinningProposal,
  releaseFunds,
  treasuryChainLabel,
  watchFundsReleased,
} from "@/lib/chains/treasury";

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
  const { data: eligibility } = useSuspenseQuery(budgetEligibilityQuery(roundId));

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

  const treasuryChainId = round?.treasury_chain_id ?? DEFAULT_TREASURY_CHAIN_ID;

  const { data: isAdmin = false } = useQuery({
    queryKey: ["treasury-admin", roundId, treasuryChainId, wallet],
    enabled: Boolean(wallet) && hasTreasuryDeployment(treasuryChainId),
    queryFn: () => isTreasuryAdmin({ chainId: treasuryChainId, roundId, account: wallet! }),
  });

  // Persist "funded" only when the on-chain FundsReleased event is observed.
  useEffect(() => {
    if (!hasTreasuryDeployment(treasuryChainId)) return;
    return watchFundsReleased({
      chainId: treasuryChainId,
      roundId,
      onLogs: () => invalidate(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId, treasuryChainId]);

  const openRound = useMutation({
    mutationFn: async () => {
      if (!round || !wallet) throw new Error("Connect a wallet to open this round.");
      const { hash, address: contract } = await createRoundTreasury({
        chainId: treasuryChainId,
        roundId,
        totalAmount: round.total_budget_amount,
        admins: [wallet],
        votingEnd: round.voting_end_date,
      });
      await recordRoundTreasury({
        roundId,
        chainId: treasuryChainId,
        address: contract,
        txHash: hash,
      });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const release = useMutation({
    mutationFn: async () => {
      if (!round) throw new Error("Round unavailable.");
      const winner = proposals[0];
      if (!winner) throw new Error("No winning proposal to fund.");
      await recordWinningProposal({
        chainId: treasuryChainId,
        roundId,
        proposalId: winner.id,
        votes: winner.vote_count,
      });
      const { hash } = await releaseFunds({
        chainId: treasuryChainId,
        roundId,
        proposalId: winner.id,
        recipient: winner.proposer_wallet_address,
        amount: winner.requested_amount,
      });
      // Only now, with a confirmed FundsReleased transaction, record funding.
      await markProposalFunded({ proposalId: winner.id, txHash: hash });
      await setRoundStatus(roundId, "funds_released");
    },
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
  const allowlistRound = round.eligibility_mode === "allowlist";
  const isEligible =
    !allowlistRound ||
    (wallet ? eligibility.some((e) => e.wallet_address.toLowerCase() === wallet) : false);
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
                    {wallet && !isEligible ? (
                      <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
                        You are not eligible to vote in this round.
                      </p>
                    ) : (
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
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <TreasuryPanel
        networkLabel={treasuryChainLabel(treasuryChainId)}
        deployed={hasTreasuryDeployment(treasuryChainId)}
        status={round.status}
        treasuryAddress={round.treasury_address}
        treasuryTxHash={round.treasury_tx_hash}
        isAdmin={isAdmin}
        votingEnded={new Date(round.voting_end_date).getTime() <= Date.now()}
        votingEndDate={round.voting_end_date}
        winner={proposals[0] ?? null}
        currency={round.currency}
        canOpen={Boolean(wallet) && round.status === "draft"}
        opening={openRound.isPending}
        onOpen={() => {
          setError(null);
          openRound.mutate();
        }}
        releasing={release.isPending}
        onRelease={() => {
          setError(null);
          release.mutate();
        }}
      />
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

function TreasuryPanel({
  networkLabel,
  deployed,
  status,
  treasuryAddress,
  treasuryTxHash,
  isAdmin,
  votingEnded,
  votingEndDate,
  winner,
  currency,
  canOpen,
  opening,
  onOpen,
  releasing,
  onRelease,
}: {
  networkLabel: string;
  deployed: boolean;
  status: string;
  treasuryAddress: string | null;
  treasuryTxHash: string | null;
  isAdmin: boolean;
  votingEnded: boolean;
  votingEndDate: string;
  winner: { id: string; title: string; requested_amount: number; release_tx_hash: string | null } | null;
  currency: string;
  canOpen: boolean;
  opening: boolean;
  onOpen: () => void;
  releasing: boolean;
  onRelease: () => void;
}) {
  return (
    <section className="mt-14 border border-rule bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="label-caps text-muted-foreground">On-chain treasury</h2>
        <span className="label-caps rounded-full border border-rule px-2 py-0.5 text-muted-foreground">
          {networkLabel}
        </span>
      </div>

      {!deployed ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No BudgetTreasury contract is configured for {networkLabel} yet. Deploy
          <span className="font-mono"> contracts/evm/BudgetTreasury.sol</span> and set the treasury
          address to enable on-chain fund release.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Funds are escrowed in a BudgetTreasury contract on {networkLabel}. Release is executed by
          the round&apos;s on-chain admins (a Gnosis Safe) and only after voting closes on{" "}
          {formatDate(votingEndDate)}.
        </p>
      )}

      {treasuryAddress ? (
        <dl className="mt-5 space-y-2 font-mono text-[11px] text-muted-foreground">
          <div>
            <dt className="inline">treasury </dt>
            <dd className="inline text-foreground">{treasuryAddress}</dd>
          </div>
          {treasuryTxHash ? (
            <div>
              <dt className="inline">created in tx </dt>
              <dd className="inline text-foreground">{treasuryTxHash}</dd>
            </div>
          ) : null}
          {winner?.release_tx_hash ? (
            <div>
              <dt className="inline">released in tx </dt>
              <dd className="inline text-foreground">{winner.release_tx_hash}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {status === "draft" ? (
          <button
            type="button"
            onClick={onOpen}
            disabled={!deployed || !canOpen || opening}
            title={canOpen ? undefined : "Connect a wallet to open this round"}
            className="border border-foreground bg-foreground px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            {opening ? "Creating treasury…" : "Open round & create treasury"}
          </button>
        ) : null}

        {isAdmin && status !== "funds_released" ? (
          <button
            type="button"
            onClick={onRelease}
            disabled={!deployed || !votingEnded || !winner || releasing}
            title={
              !votingEnded
                ? `Release unlocks after ${formatDate(votingEndDate)}`
                : !winner
                  ? "No winning proposal yet"
                  : undefined
            }
            className="border border-foreground px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
          >
            {releasing ? "Releasing…" : "Release funds"}
          </button>
        ) : null}
      </div>

      {winner ? (
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          winning proposal · {winner.title} · {formatAmount(winner.requested_amount, currency)}
        </p>
      ) : null}
      {!isAdmin && status !== "draft" ? (
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          Fund release is restricted to the round&apos;s on-chain admins.
        </p>
      ) : null}
    </section>
  );
}
