import { createConfig, http, connect, disconnect, getAccount, readContract, signMessage, switchChain, watchAccount, watchChainId } from "@wagmi/core";
import { injected } from "@wagmi/connectors";
import { arbitrum, base, bscTestnet, celo, mainnet, optimism, polygon, sepolia } from "viem/chains";
import { erc20Abi, getAddress } from "viem";
import type { ChainAdapter, SignedVote, VoteData } from "./types";
import { voteMessage } from "./types";

/**
 * Every EVM chain runs the identical adapter code path — adding one here is
 * configuration only, no new adapter. Non-EVM chains (Stellar) need their own.
 */
export const EVM_CHAINS = [
  bscTestnet,
  sepolia,
  mainnet,
  base,
  arbitrum,
  polygon,
  optimism,
  celo,
] as const;

export const wagmiConfig = createConfig({
  chains: EVM_CHAINS,
  connectors: [injected({ shimDisconnect: true })],
  ssr: true,
  transports: {
    [bscTestnet.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [celo.id]: http(),
  },
});

export { getAccount, watchAccount, watchChainId, disconnect as disconnectWallet };

export async function switchEvmChain(chainId: number) {
  await switchChain(wagmiConfig, { chainId: chainId as (typeof EVM_CHAINS)[number]["id"] });
}

function isEvmChainId(chainId: number): chainId is (typeof EVM_CHAINS)[number]["id"] {
  return EVM_CHAINS.some((c) => c.id === chainId);
}

/** EVM adapter — identical code path for BNB testnet and Sepolia. */
export function createEvmAdapter(chainId: number): ChainAdapter {
  return {
    chainId: `eip155:${chainId}`,

    async connectWallet() {
      const existing = getAccount(wagmiConfig);
      if (existing.address) return { address: existing.address };
      const result = await connect(wagmiConfig, {
        connector: wagmiConfig.connectors[0]!,
      });
      const address = result.accounts[0];
      if (!address) throw new Error("No account returned by the wallet.");
      return { address };
    },

    async getBalance(tokenAddress: string, walletAddress: string) {
      if (!isEvmChainId(chainId)) {
        throw new Error(`Unsupported network (chain ${chainId}).`);
      }
      return (await readContract(wagmiConfig, {
        chainId,
        address: getAddress(tokenAddress),
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [getAddress(walletAddress)],
      })) as bigint;
    },

    async signVote(vote: VoteData): Promise<SignedVote> {
      const message = voteMessage(vote);
      const signature = await signMessage(wagmiConfig, { message });
      return { message, signature, chainId };
    },

    async isEligible(tokenAddress: string, walletAddress: string, minBalance: bigint) {
      const balance = await this.getBalance(tokenAddress, walletAddress);
      return balance >= minBalance;
    },
  };
}
