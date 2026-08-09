import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  castVote,
  chainNameById,
  shortRef,
  type Choice,
  type DocketItem,
} from "@/lib/db";
import {
  KIND_BADGE,
  KIND_BAR,
  KIND_LABEL,
  STATUS_BADGE,
  formatNumber,
  statusTone,
} from "@/lib/mishkan-data";
import { ChainChipById } from "@/components/chain-chip";
import { eligibilityMessage, useEligibility } from "@/lib/eligibility";
import { useWallet } from "@/lib/wallet";
import { Discussion } from "@/components/discussion";

const CHOICES: { key: Choice; label: string }[] = [
  { key: "for", label: "For" },
  { key: "against", label: "Against" },
  { key: "abstain", label: "Abstain" },
];

function Tally({ tally }: { tally: DocketItem["tally"] }) {
  const total = tally.for + tally.against + tally.abstain;
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);

  return (
    <div className="w-full max-w-xs">
      <div className="flex h-1.5 w-full overflow-hidden bg-muted">
        <div style={{ width: `${pct(tally.for)}%` }} className="bg-passed" />
        <div style={{ width: `${pct(tally.against)}%` }} className="bg-failed" />
        <div style={{ width: `${pct(tally.abstain)}%` }} className="bg-muted-foreground/40" />
      </div>
      <dl className="mt-2.5 flex gap-4 font-mono text-[11px] text-muted-foreground">
        {CHOICES.map((c) => (
          <div key={c.key} className="flex gap-1.5">
            <dt>{c.label}</dt>
            <dd className="text-foreground">{formatNumber(tally[c.key])}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function DocketRow({ item, votable }: { item: DocketItem; votable: boolean }) {
  const wallet = useWallet();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  const eligibility = useEligibility(item.council);
  const gateNote = eligibilityMessage(eligibility, chainNameById);

  const address = wallet.address?.toLowerCase() ?? null;
  const hasVoted = address ? item.voters.includes(address) : false;

  const vote = useMutation({
    mutationFn: async (choice: Choice) => {
      const adapter = wallet.adapter;
      if (!adapter) throw new Error("Unsupported network.");
      const signed = await adapter.signVote({
        docketItemId: item.id,
        choice,
        voter: address!,
      });
      await castVote({
        docketItemId: item.id,
        wallet: address!,
        choice,
        chainId: wallet.chainId,
        signature: signed.signature,
      });
    },
    onSuccess: () => {
      setMessage(null);
      void queryClient.invalidateQueries({ queryKey: ["docket"] });
    },
    onError: (e: unknown) => {
      const raw = e instanceof Error ? e.message : "Vote could not be recorded.";
      setMessage(raw.includes("duplicate") ? "This wallet has already voted." : raw);
    },
  });

  return (
    <article className="relative grid grid-cols-1 gap-6 border-b border-rule py-8 pl-4 md:grid-cols-[9rem_1fr_auto] md:gap-10">
      <span
        aria-hidden
        className={`absolute left-0 top-8 bottom-8 w-[3px] ${KIND_BAR[item.type]} opacity-70`}
      />
      <div className="flex flex-row flex-wrap items-baseline gap-3 md:flex-col md:items-start md:gap-2">
        <span className="font-mono text-xs text-muted-foreground">{shortRef(item.id)}</span>
        <span
          className={`label-caps rounded-full border px-2 py-0.5 ${KIND_BADGE[item.type]}`}
        >
          {KIND_LABEL[item.type]}
        </span>
        <span
          className={`label-caps rounded-full border px-2 py-0.5 md:mt-1 ${
            STATUS_BADGE[statusTone(item.status)]
          }`}
        >
          {item.status === "open" ? "Open" : "Resolved"}
        </span>
      </div>

      <div className="max-w-2xl">
        <h2 className="text-xl leading-snug md:text-2xl">{item.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
        <p className="mt-4 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-muted-foreground">
          <span>
            {item.council?.community_name ?? "Unaffiliated"}
            {item.council?.token_symbol ? ` · ${item.council.token_symbol}` : ""}
          </span>
          <span aria-hidden>·</span>
          <ChainChipById
            chainId={item.council?.chain_id}
            label={chainNameById(item.council?.chain_id)}
          />
          <span aria-hidden>·</span>
          filed{" "}
          {new Date(item.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}{" "}
          by {item.created_by_wallet.slice(0, 6)}…{item.created_by_wallet.slice(-4)}
        </p>
        {item.resolution ? (
          <p className="mt-3 border-l-2 border-rule pl-3 text-sm italic text-foreground">
            {item.resolution}
          </p>
        ) : null}
      </div>

      <div className="md:pt-1">
        <Tally tally={item.tally} />

        {votable ? (
          <div className="mt-4">
            {hasVoted ? (
              <p className="font-mono text-[11px] text-muted-foreground">
                Vote recorded from this wallet.
              </p>
            ) : eligibility.state === "eligible" ? (
              <div className="flex gap-2">
                {CHOICES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    disabled={vote.isPending}
                    onClick={() => vote.mutate(c.key)}
                    className="border border-input px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            ) : (
              <p
                className={`font-mono text-[11px] ${
                  eligibility.state === "not-eligible" ? "text-failed" : "text-muted-foreground"
                }`}
              >
                {gateNote}
              </p>
            )}
            {eligibility.state === "eligible" ? (
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                Voting is gas-free — your wallet signs a message, no transaction.
              </p>
            ) : null}
            {message ? (
              <p className="mt-2 font-mono text-[11px] text-failed">{message}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="md:col-span-3">
        <button
          type="button"
          onClick={() => setShowThread((v) => !v)}
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {showThread ? "Hide discussion" : "Discussion"}
        </button>
        {showThread ? <Discussion docketItemId={item.id} /> : null}
      </div>
    </article>
  );
}
