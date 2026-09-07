import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading } from "@/components/record";
import { STATUS_BADGE, formatDate, formatNumber } from "@/lib/mishkan-data";
import { chainNameById } from "@/lib/db";
import { ChainChipById } from "@/components/chain-chip";
import { explorerTxUrl } from "@/lib/chains/treasury";
import {
  ROUND_STATUS_LABEL,
  ROUND_STATUS_TONE,
  budgetRoundsQuery,
  formatAmount,
  type BudgetRoundStatus,
} from "@/lib/budget";

export type TransparencyStats = {
  totalRounds: number;
  totalDisbursed: number;
  disbursedCurrency: string;
  uniqueVoters: number;
};

const transparencyStatsQuery = queryOptions({
  queryKey: ["budget-transparency-stats"],
  queryFn: async (): Promise<TransparencyStats> => {
    const [rounds, funded, votes] = await Promise.all([
      supabase.from("budget_rounds").select("id", { count: "exact", head: true }),
      supabase
        .from("budget_proposals")
        .select("requested_amount, budget_rounds(currency)")
        .eq("status", "funded"),
      supabase.from("budget_votes").select("voter_wallet_address"),
    ]);
    if (rounds.error) throw rounds.error;
    if (funded.error) throw funded.error;
    if (votes.error) throw votes.error;

    let totalDisbursed = 0;
    let disbursedCurrency = "USD";
    for (const row of funded.data ?? []) {
      totalDisbursed += Number(row.requested_amount ?? 0);
      const currency = (row as { budget_rounds?: { currency?: string } | null }).budget_rounds
        ?.currency;
      if (currency) disbursedCurrency = currency;
    }
    const voters = new Set(
      (votes.data ?? []).map((v) => (v.voter_wallet_address ?? "").toLowerCase()),
    );

    return {
      totalRounds: rounds.count ?? 0,
      totalDisbursed,
      disbursedCurrency,
      uniqueVoters: voters.size,
    };
  },
});

type ReleaseRecord = { roundId: string; txHash: string | null; amount: number };

const releasesQuery = queryOptions({
  queryKey: ["budget-releases"],
  queryFn: async (): Promise<ReleaseRecord[]> => {
    const { data, error } = await supabase
      .from("budget_proposals")
      .select("budget_round_id, release_tx_hash, requested_amount")
      .eq("status", "funded");
    if (error) throw error;
    return (data ?? []).map((r) => ({
      roundId: r.budget_round_id as string,
      txHash: (r.release_tx_hash as string | null) ?? null,
      amount: Number(r.requested_amount ?? 0),
    }));
  },
});

export const Route = createFileRoute("/budget-rounds/transparency")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(budgetRoundsQuery);
    context.queryClient.ensureQueryData(releasesQuery);
    context.queryClient.ensureQueryData(transparencyStatsQuery);
  },
  head: () => ({
    meta: [
      { title: "Budget Transparency — Mishkan Protocol" },
      {
        name: "description",
        content:
          "Public accountability ledger for participatory budget rounds: every community's budget, proposal and voter counts, and funds released — no wallet required.",
      },
      { property: "og:title", content: "Budget Transparency — Mishkan Protocol" },
      {
        property: "og:description",
        content:
          "A public record of every budget round: amounts, participation, and released funds across all communities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TransparencyPage,
  errorComponent: () => (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm text-muted-foreground">
        The transparency ledger is unavailable right now.
      </p>
    </div>
  ),
});

const STATUS_FILTERS: { value: "all" | BudgetRoundStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "funds_released", label: "Funds released" },
];

function TransparencyPage() {
  const { data: rounds } = useSuspenseQuery(budgetRoundsQuery);
  const { data: stats } = useSuspenseQuery(transparencyStatsQuery);
  const { data: releases } = useSuspenseQuery(releasesQuery);

  const [community, setCommunity] = useState("all");
  const [status, setStatus] = useState<"all" | BudgetRoundStatus>("all");
  const [chain, setChain] = useState("all");

  const communities = useMemo(() => {
    const names = new Set<string>();
    for (const r of rounds) if (r.community_name) names.add(r.community_name);
    return [...names].sort();
  }, [rounds]);

  const chains = useMemo(() => {
    const ids = new Set<number>();
    for (const r of rounds) if (r.treasury_chain_id != null) ids.add(r.treasury_chain_id);
    return [...ids].sort((a, b) => a - b);
  }, [rounds]);

  const filtered = rounds.filter((r) => {
    if (community !== "all" && r.community_name !== community) return false;
    if (status !== "all" && r.status !== status) return false;
    if (chain !== "all" && String(r.treasury_chain_id ?? "") !== chain) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageHeading
        eyebrow="Public ledger"
        title="Budget Transparency"
        lede="Every budget round on the public record — amounts, participation, and released funds. Open to anyone; no wallet required."
      />

      <section className="mt-12 grid grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-3">
        <Stat label="Budget rounds run" value={formatNumber(stats.totalRounds)} />
        <Stat
          label="Total disbursed"
          value={formatAmount(
            releases.reduce((sum, r) => sum + r.amount, 0) || stats.totalDisbursed,
            stats.disbursedCurrency,
          )}
        />
        <Stat label="Unique voters" value={formatNumber(stats.uniqueVoters)} />
      </section>

      <section className="mt-10 flex flex-wrap items-end gap-4">
        <FilterSelect
          label="Community"
          value={community}
          onChange={setCommunity}
          options={[
            { value: "all", label: "All communities" },
            ...communities.map((c) => ({ value: c, label: c })),
          ]}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as "all" | BudgetRoundStatus)}
          options={STATUS_FILTERS}
        />
        <FilterSelect
          label="Chain"
          value={chain}
          onChange={setChain}
          options={[
            { value: "all", label: "All chains" },
            ...chains.map((id) => ({ value: String(id), label: chainNameById(id) })),
          ]}
        />
      </section>

      <section className="mt-8 overflow-x-auto border border-rule">
        <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-rule bg-card">
              {[
                "Round",
                "Community",
                "Budget",
                "Status",
                "Proposals",
                "Voters",
                "Funds released",
                "Network",
              ].map((h) => (
                <th key={h} className="label-caps px-4 py-3 font-normal text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No rounds match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const roundReleases = releases.filter((x) => x.roundId === r.id);
                const released = r.status === "funds_released" || roundReleases.length > 0;
                const releaseTx = roundReleases.find((x) => x.txHash)?.txHash ?? null;
                const txUrl = releaseTx ? explorerTxUrl(r.treasury_chain_id, releaseTx) : null;
                const pilotPending = r.treasury_chain_id != null && !r.treasury_address;
                return (
                  <tr key={r.id} className="border-b border-rule transition-colors hover:bg-card">
                    <td className="px-4 py-3">
                      <Link
                        to="/budget-rounds/$roundId"
                        params={{ roundId: r.id }}
                        className="underline-offset-4 hover:underline"
                      >
                        {r.title}
                      </Link>
                      <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                        BR-{r.id.slice(0, 4).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.community_name ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {formatAmount(r.total_budget_amount, r.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`label-caps rounded-full border px-2 py-0.5 ${STATUS_BADGE[ROUND_STATUS_TONE[r.status]]}`}
                      >
                        {ROUND_STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{formatNumber(r.proposal_count)}</td>
                    <td className="px-4 py-3 font-mono">{formatNumber(r.vote_count)}</td>
                    <td className="px-4 py-3">
                      {released ? (
                        <span>
                          Yes
                          <span className="block font-mono text-[11px] text-muted-foreground">
                            {formatDate(r.voting_end_date)}
                          </span>
                          {releaseTx ? (
                            txUrl ? (
                              <a
                                href={txUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 block font-mono text-[11px] underline underline-offset-4"
                              >
                                {releaseTx.slice(0, 10)}…{releaseTx.slice(-6)}
                              </a>
                            ) : (
                              <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                                {releaseTx.slice(0, 10)}…
                              </span>
                            )
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.treasury_chain_id != null ? (
                        <>
                          <ChainChipById
                            chainId={r.treasury_chain_id}
                            label={chainNameById(r.treasury_chain_id)}
                          />
                          {pilotPending ? (
                            <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                              Pilot pending network setup
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Off-chain</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <p className="mt-6 font-mono text-[11px] text-muted-foreground">
        {formatNumber(filtered.length)} of {formatNumber(rounds.length)} rounds shown ·
        figures update directly from the public record.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background px-6 py-6">
      <p className="label-caps text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-3xl tracking-tight">{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="label-caps text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-rule bg-background px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
