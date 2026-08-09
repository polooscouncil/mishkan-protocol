import { createEvmAdapter, EVM_CHAINS } from "./evm";
import type { ChainAdapter } from "./types";

export type { ChainAdapter, SignedVote, VoteData } from "./types";
export { wagmiConfig, EVM_CHAINS } from "./evm";

/**
 * Adapter registry. Stellar (a different wallet/RPC model) will register its
 * own adapter here rather than being forced through the EVM path.
 */
export function getAdapter(chainId: number | null | undefined): ChainAdapter | null {
  if (chainId == null) return null;
  if (EVM_CHAINS.some((c) => c.id === chainId)) return createEvmAdapter(chainId);
  return null;
}

export function isSupportedChain(chainId: number | null | undefined) {
  return chainId != null && EVM_CHAINS.some((c) => c.id === chainId);
}
