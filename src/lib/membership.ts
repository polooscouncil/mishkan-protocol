import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Council } from "@/lib/db";

export type CouncilClaim = {
  id: string;
  council_id: string;
  wallet: string;
  status: "pending" | "confirmed" | "failed";
  tx_hash: string | null;
  created_at: string;
};

/** The council's token gate: ERC-20 address on EVM, CIP-0113 policy id on Cardano. */
export function councilAssetId(council: Council | null | undefined) {
  if (!council) return null;
  return council.chain_family === "cardano"
    ? (council.policy_id ?? null)
    : (council.token_address ?? null);
}

export function isCardanoCouncil(council: Council | null | undefined) {
  return council?.chain_family === "cardano";
}

export function claimQuery(councilId: string | null, wallet: string | null) {
  return queryOptions({
    queryKey: ["council-claim", councilId, wallet],
    enabled: Boolean(councilId && wallet),
    queryFn: async (): Promise<CouncilClaim | null> => {
      const { data, error } = await supabase
        .from("council_claims")
        .select("id, council_id, wallet, status, tx_hash, created_at")
        .eq("council_id", councilId!)
        .eq("wallet", wallet!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as CouncilClaim | null;
    },
  });
}

/**
 * Records a member's self-claim. The claim transaction itself is signed and
 * paid for by the member's own wallet — the protocol holds no keys and there
 * is deliberately no admin distribution path.
 */
export async function recordClaim(input: {
  councilId: string;
  wallet: string;
  txHash?: string | null;
}) {
  const { error } = await supabase.from("council_claims").insert({
    council_id: input.councilId,
    wallet: input.wallet,
    tx_hash: input.txHash ?? null,
  });
  if (error && !error.message.includes("duplicate")) throw error;
}
