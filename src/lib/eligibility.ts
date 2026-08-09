import { useQuery } from "@tanstack/react-query";
import type { Council } from "@/lib/db";
import { useWallet } from "@/lib/wallet";

export type Eligibility =
  | { state: "no-wallet" }
  | { state: "no-council" }
  | { state: "wrong-network"; expected: number }
  | { state: "checking" }
  | { state: "error"; message: string }
  | { state: "eligible"; balance: bigint; min: bigint }
  | { state: "not-eligible"; balance: bigint; min: bigint };

/**
 * Checks the connected wallet against the council's configured ERC-20 gate.
 */
export function useEligibility(council: Council | null | undefined): Eligibility {
  const wallet = useWallet();
  const address = wallet.address ?? null;
  const min = council ? BigInt(Math.trunc(Number(council.min_balance) || 0)) : 0n;

  const enabled = Boolean(address && council && council.chain_id === wallet.chainId);

  const query = useQuery({
    queryKey: ["eligibility", council?.id, address, wallet.chainId],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const adapter = wallet.adapter!;
      const balance = await adapter.getBalance(council!.token_address, address!);
      return { balance, eligible: balance >= min };
    },
  });

  if (!address) return { state: "no-wallet" };
  if (!council) return { state: "no-council" };
  if (council.chain_id !== wallet.chainId) {
    return { state: "wrong-network", expected: council.chain_id };
  }
  if (query.isPending) return { state: "checking" };
  if (query.isError) {
    return {
      state: "error",
      message:
        query.error instanceof Error
          ? query.error.message
          : "Token balance could not be read.",
    };
  }
  return query.data!.eligible
    ? { state: "eligible", balance: query.data!.balance, min }
    : { state: "not-eligible", balance: query.data!.balance, min };
}

export function eligibilityMessage(e: Eligibility, chainName: (id: number) => string) {
  switch (e.state) {
    case "no-wallet":
      return "Connect a wallet to vote.";
    case "no-council":
      return "No community configured for this item.";
    case "wrong-network":
      return `Switch to ${chainName(e.expected)} to vote on this item.`;
    case "checking":
      return "Checking token balance…";
    case "error":
      return e.message;
    case "not-eligible":
      return "Not eligible to vote — the connected wallet does not hold enough of the configured token.";
    default:
      return null;
  }
}
