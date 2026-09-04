import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StatusTone } from "@/lib/mishkan-data";

export type BudgetRoundStatus = "draft" | "open" | "closed" | "funds_released";
export type BudgetProposalStatus = "submitted" | "approved" | "rejected" | "funded";
export type BudgetEligibilityMode = "open" | "allowlist";

export type BudgetRound = {
  id: string;
  title: string;
  description: string;
  community_id: string;
  total_budget_amount: number;
  currency: string;
  voting_start_date: string;
  voting_end_date: string;
  status: BudgetRoundStatus;
  eligibility_mode: BudgetEligibilityMode;
  treasury_chain_id: number | null;
  treasury_address: string | null;
  treasury_tx_hash: string | null;
  created_by: string;
  created_at: string;
  community_name: string | null;
  proposal_count: number;
  vote_count: number;
  eligible_count: number;
};


export type BudgetProposal = {
  id: string;
  budget_round_id: string;
  title: string;
  description: string;
  requested_amount: number;
  proposer_wallet_address: string;
  vote_count: number;
  status: BudgetProposalStatus;
  created_at: string;
  release_tx_hash: string | null;
};

export const ROUND_STATUS_LABEL: Record<BudgetRoundStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  funds_released: "Funds released",
};

export const ROUND_STATUS_TONE: Record<BudgetRoundStatus, StatusTone> = {
  draft: "pending",
  open: "open",
  closed: "returned",
  funds_released: "resolved",
};

export const PROPOSAL_STATUS_LABEL: Record<BudgetProposalStatus, string> = {
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  funded: "Funded",
};

export const PROPOSAL_STATUS_TONE: Record<BudgetProposalStatus, StatusTone> = {
  submitted: "pending",
  approved: "open",
  rejected: "returned",
  funded: "resolved",
};

export function formatAmount(amount: number, currency: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
}

const ROUND_SELECT =
  "id, title, description, community_id, total_budget_amount, currency, voting_start_date, voting_end_date, status, eligibility_mode, treasury_chain_id, treasury_address, treasury_tx_hash, created_by, created_at, councils(community_name), budget_proposals(id), budget_votes(id), budget_round_eligibility(id)";

type RoundRow = Omit<
  BudgetRound,
  "community_name" | "proposal_count" | "vote_count" | "eligible_count"
> & {
  councils?: { community_name: string } | null;
  budget_proposals?: { id: string }[];
  budget_votes?: { id: string }[];
  budget_round_eligibility?: { id: string }[];
};

function mapRound(row: RoundRow): BudgetRound {
  const { councils, budget_proposals, budget_votes, budget_round_eligibility, ...rest } = row;
  return {
    ...rest,
    total_budget_amount: Number(rest.total_budget_amount),
    community_name: councils?.community_name ?? null,
    proposal_count: budget_proposals?.length ?? 0,
    vote_count: budget_votes?.length ?? 0,
    eligible_count: budget_round_eligibility?.length ?? 0,
  };
}


export const budgetRoundsQuery = queryOptions({
  queryKey: ["budget-rounds"],
  queryFn: async (): Promise<BudgetRound[]> => {
    const { data, error } = await supabase
      .from("budget_rounds")
      .select(ROUND_SELECT)
      .order("voting_start_date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => mapRound(row as unknown as RoundRow));
  },
});

export function budgetRoundQuery(id: string) {
  return queryOptions({
    queryKey: ["budget-round", id],
    queryFn: async (): Promise<BudgetRound | null> => {
      const { data, error } = await supabase
        .from("budget_rounds")
        .select(ROUND_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapRound(data as unknown as RoundRow) : null;
    },
  });
}

export function budgetProposalsQuery(roundId: string) {
  return queryOptions({
    queryKey: ["budget-proposals", roundId],
    queryFn: async (): Promise<BudgetProposal[]> => {
      const { data, error } = await supabase
        .from("budget_proposals")
        .select(
          "id, budget_round_id, title, description, requested_amount, proposer_wallet_address, vote_count, status, created_at, release_tx_hash",
        )
        .eq("budget_round_id", roundId)
        .order("vote_count", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...(row as unknown as BudgetProposal),
        requested_amount: Number(row.requested_amount),
      }));
    },
  });
}

export function budgetVotesQuery(roundId: string) {
  return queryOptions({
    queryKey: ["budget-votes", roundId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_votes")
        .select("id, proposal_id, voter_wallet_address, weight, created_at")
        .eq("budget_round_id", roundId);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export async function submitBudgetProposal(input: {
  roundId: string;
  wallet: string;
  title: string;
  description: string;
  requestedAmount: number;
}) {
  const { error } = await supabase.from("budget_proposals").insert({
    budget_round_id: input.roundId,
    title: input.title.slice(0, 160),
    description: input.description.slice(0, 2000),
    requested_amount: input.requestedAmount,
    proposer_wallet_address: input.wallet.toLowerCase(),
    status: "submitted",
  });
  if (error) throw error;
}

export async function castBudgetVote(input: {
  roundId: string;
  proposalId: string;
  wallet: string;
}) {
  const { error } = await supabase.from("budget_votes").insert({
    budget_round_id: input.roundId,
    proposal_id: input.proposalId,
    voter_wallet_address: input.wallet.toLowerCase(),
    weight: 1,
  });
  if (error) throw error;
}

export async function setRoundStatus(roundId: string, status: BudgetRoundStatus) {
  const { error } = await supabase.from("budget_rounds").update({ status }).eq("id", roundId);
  if (error) throw error;
}

/** Persist the on-chain treasury record after createRoundTreasury confirms. */
export async function recordRoundTreasury(input: {
  roundId: string;
  chainId: number;
  address: string;
  txHash: string;
}) {
  const { error } = await supabase
    .from("budget_rounds")
    .update({
      treasury_chain_id: input.chainId,
      treasury_address: input.address,
      treasury_tx_hash: input.txHash,
      status: "open",
    })
    .eq("id", input.roundId);
  if (error) throw error;
}

/** Mark a proposal funded — only valid with a confirmed on-chain tx hash. */
export async function markProposalFunded(input: { proposalId: string; txHash: string }) {
  const { error } = await supabase
    .from("budget_proposals")
    .update({ status: "funded", release_tx_hash: input.txHash })
    .eq("id", input.proposalId);
  if (error) throw error;
}

export function budgetEligibilityQuery(roundId: string) {
  return queryOptions({
    queryKey: ["budget-eligibility", roundId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_round_eligibility")
        .select("id, wallet_address, added_by, added_at")
        .eq("budget_round_id", roundId)
        .order("added_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export function isEvmAddress(value: string) {
  return EVM_ADDRESS.test(value.trim());
}

/** Parse a pasted allowlist (one address per line) into unique addresses + per-line errors. */
export function parseAllowlist(raw: string) {
  const seen = new Set<string>();
  const addresses: string[] = [];
  const errors: { line: number; value: string; reason: string }[] = [];

  raw.split(/\r?\n/).forEach((line, i) => {
    const value = line.trim();
    if (!value) return;
    if (!isEvmAddress(value)) {
      errors.push({
        line: i + 1,
        value,
        reason: "Not a valid EVM address (expected 0x followed by 40 hex characters).",
      });
      return;
    }
    const normalized = value.toLowerCase();
    if (seen.has(normalized)) {
      errors.push({ line: i + 1, value, reason: "Duplicate address." });
      return;
    }
    seen.add(normalized);
    addresses.push(normalized);
  });

  return { addresses, errors };
}

export async function createBudgetRound(input: {
  wallet: string;
  communityId: string;
  title: string;
  description: string;
  totalBudgetAmount: number;
  currency: string;
  votingStartDate: string;
  votingEndDate: string;
  eligibilityMode: BudgetEligibilityMode;
  allowlist: string[];
}) {
  const { data, error } = await supabase
    .from("budget_rounds")
    .insert({
      community_id: input.communityId,
      title: input.title.slice(0, 160),
      description: input.description.slice(0, 2000),
      total_budget_amount: input.totalBudgetAmount,
      currency: input.currency,
      voting_start_date: input.votingStartDate,
      voting_end_date: input.votingEndDate,
      status: "open",
      eligibility_mode: input.eligibilityMode,
      created_by: input.wallet.toLowerCase(),
    })
    .select("id")
    .single();
  if (error) throw error;

  if (input.eligibilityMode === "allowlist" && input.allowlist.length > 0) {
    const { error: eligError } = await supabase.from("budget_round_eligibility").insert(
      input.allowlist.map((wallet_address) => ({
        budget_round_id: data.id,
        wallet_address,
        added_by: input.wallet.toLowerCase(),
      })),
    );
    if (eligError) throw eligError;
  }

  return data.id as string;
}

export async function addEligibleVoters(input: {
  roundId: string;
  wallet: string;
  addresses: string[];
}) {
  if (input.addresses.length === 0) return;
  const { error } = await supabase.from("budget_round_eligibility").insert(
    input.addresses.map((wallet_address) => ({
      budget_round_id: input.roundId,
      wallet_address,
      added_by: input.wallet.toLowerCase(),
    })),
  );
  if (error) throw error;
}
