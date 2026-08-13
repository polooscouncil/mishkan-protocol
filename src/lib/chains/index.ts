import { createEvmAdapter, EVM_CHAINS } from "./evm";
import { createCardanoAdapter, CARDANO_CHAIN_ID } from "./cardano";
import type { ChainAdapter } from "./types";

export type { ChainAdapter, SignedVote, VoteData } from "./types";
export { wagmiConfig, EVM_CHAINS } from "./evm";
export { CARDANO_CHAIN_ID } from "./cardano";

/**
 * Adapter registry. EVM chains share one adapter (adding one is configuration
 * only). Cardano is non-EVM and registers its own dedicated adapter.
 */
export function getAdapter(chainId: number | null | undefined): ChainAdapter | null {
  if (chainId == null) return null;
  if (chainId === CARDANO_CHAIN_ID) return createCardanoAdapter();
  if (EVM_CHAINS.some((c) => c.id === chainId)) return createEvmAdapter(chainId);
  return null;
}

export function isCardanoChain(chainId: number | null | undefined) {
  return chainId === CARDANO_CHAIN_ID;
}

export function isSupportedChain(chainId: number | null | undefined) {
  return (
    chainId != null && (chainId === CARDANO_CHAIN_ID || EVM_CHAINS.some((c) => c.id === chainId))
  );
}
