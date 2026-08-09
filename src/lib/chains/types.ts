export type VoteData = {
  docketItemId: string;
  choice: "for" | "against" | "abstain";
  voter: string;
};

export type SignedVote = {
  message: string;
  signature: string;
  chainId: number | null;
};

/**
 * A chain family adapter. Every chain integration (EVM today, Stellar later)
 * implements this surface so the rest of the app never touches chain SDKs.
 */
export interface ChainAdapter {
  /** Namespaced id, e.g. "eip155:97" or "stellar:testnet". */
  chainId: string;
  connectWallet(): Promise<{ address: string }>;
  getBalance(tokenAddress: string, walletAddress: string): Promise<bigint>;
  signVote(vote: VoteData): Promise<SignedVote>;
  isEligible(
    tokenAddress: string,
    walletAddress: string,
    minBalance: bigint,
  ): Promise<boolean>;
}

export function voteMessage(vote: VoteData) {
  return [
    "Mishkan Protocol — vote",
    `Item: ${vote.docketItemId}`,
    `Choice: ${vote.choice}`,
    `Voter: ${vote.voter}`,
  ].join("\n");
}
