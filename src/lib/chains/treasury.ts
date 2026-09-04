import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
  watchContractEvent,
} from "@wagmi/core";
import { getAddress, parseUnits, type Address, type Log } from "viem";
import { bscTestnet } from "viem/chains";
import { wagmiConfig } from "./evm";

/** ABI surface of contracts/evm/BudgetTreasury.sol used by the app. */
export const budgetTreasuryAbi = [
  {
    type: "function",
    name: "createRoundTreasury",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "totalAmount", type: "uint256" },
      { name: "admins", type: "address[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "recordVotingEnd",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "votingEnd", type: "uint64" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "recordWinningProposal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "proposalId", type: "uint256" },
      { name: "votes", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "releaseFunds",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "proposalId", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isRoundAdmin",
    stateMutability: "view",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "roundInfo",
    stateMutability: "view",
    inputs: [{ name: "roundId", type: "uint256" }],
    outputs: [
      { name: "exists", type: "bool" },
      { name: "totalAmount", type: "uint256" },
      { name: "released", type: "uint256" },
      { name: "votingEnd", type: "uint64" },
      { name: "winningProposalId", type: "uint256" },
      { name: "winningVotes", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "FundsReleased",
    inputs: [
      { name: "roundId", type: "uint256", indexed: true },
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "votes", type: "uint256", indexed: false },
    ],
  },
] as const;

/**
 * Per-chain treasury deployments. BNB Chain testnet is the only wired network
 * for now — the same pattern ports to the other EVM chains once proven.
 */
export const TREASURY_CHAINS: {
  chainId: number;
  label: string;
  address: Address | null;
  tokenDecimals: number;
}[] = [
  {
    chainId: bscTestnet.id,
    label: "BNB Chain Testnet",
    address: (import.meta.env['VITE_BUDGET_TREASURY_97'] as Address | undefined) ?? null,
    tokenDecimals: 18,
  },
];

export const DEFAULT_TREASURY_CHAIN_ID = bscTestnet.id;

export function treasuryConfig(chainId: number | null | undefined) {
  return TREASURY_CHAINS.find((c) => c.chainId === (chainId ?? DEFAULT_TREASURY_CHAIN_ID)) ?? null;
}

export function treasuryChainLabel(chainId: number | null | undefined) {
  return treasuryConfig(chainId)?.label ?? `Chain ${chainId ?? "?"}`;
}

/** Deterministic uint256 round id derived from the off-chain UUID. */
export function onChainId(uuid: string): bigint {
  return BigInt(`0x${uuid.replace(/-/g, "")}`) >> 128n;
}

function requireContract(chainId: number) {
  const cfg = treasuryConfig(chainId);
  if (!cfg?.address) {
    throw new Error(
      `No BudgetTreasury deployment configured for ${treasuryChainLabel(chainId)}. Deploy contracts/evm/BudgetTreasury.sol and set VITE_BUDGET_TREASURY_${chainId}.`,
    );
  }
  return { ...cfg, address: getAddress(cfg.address) };
}

export function hasTreasuryDeployment(chainId: number | null | undefined) {
  return Boolean(treasuryConfig(chainId)?.address);
}

export async function isTreasuryAdmin(input: {
  chainId: number;
  roundId: string;
  account: string;
}): Promise<boolean> {
  const cfg = treasuryConfig(input.chainId);
  if (!cfg?.address) return false;
  try {
    return (await readContract(wagmiConfig, {
      chainId: input.chainId as 97,
      address: getAddress(cfg.address),
      abi: budgetTreasuryAbi,
      functionName: "isRoundAdmin",
      args: [onChainId(input.roundId), getAddress(input.account)],
    })) as boolean;
  } catch {
    return false;
  }
}

export async function readRoundTreasury(input: { chainId: number; roundId: string }) {
  const cfg = requireContract(input.chainId);
  const result = (await readContract(wagmiConfig, {
    chainId: input.chainId as 97,
    address: cfg.address,
    abi: budgetTreasuryAbi,
    functionName: "roundInfo",
    args: [onChainId(input.roundId)],
  })) as readonly [boolean, bigint, bigint, bigint, bigint, bigint];
  return {
    exists: result[0],
    totalAmount: result[1],
    released: result[2],
    votingEnd: Number(result[3]),
    winningProposalId: result[4],
    winningVotes: result[5],
  };
}

/** Register the round treasury on-chain (draft → open). */
export async function createRoundTreasury(input: {
  chainId: number;
  roundId: string;
  totalAmount: number;
  admins: string[];
  votingEnd: string;
}) {
  const cfg = requireContract(input.chainId);
  const hash = await writeContract(wagmiConfig, {
    chainId: input.chainId as 97,
    address: cfg.address,
    abi: budgetTreasuryAbi,
    functionName: "createRoundTreasury",
    args: [
      onChainId(input.roundId),
      parseUnits(String(input.totalAmount), cfg.tokenDecimals),
      input.admins.map((a) => getAddress(a)),
    ],
  });
  await waitForTransactionReceipt(wagmiConfig, { chainId: input.chainId as 97, hash });

  const votingEndTs = BigInt(Math.floor(new Date(input.votingEnd).getTime() / 1000));
  const endHash = await writeContract(wagmiConfig, {
    chainId: input.chainId as 97,
    address: cfg.address,
    abi: budgetTreasuryAbi,
    functionName: "recordVotingEnd",
    args: [onChainId(input.roundId), votingEndTs],
  });
  await waitForTransactionReceipt(wagmiConfig, { chainId: input.chainId as 97, hash: endHash });

  return { hash, address: cfg.address as string };
}

export async function recordWinningProposal(input: {
  chainId: number;
  roundId: string;
  proposalId: string;
  votes: number;
}) {
  const cfg = requireContract(input.chainId);
  const hash = await writeContract(wagmiConfig, {
    chainId: input.chainId as 97,
    address: cfg.address,
    abi: budgetTreasuryAbi,
    functionName: "recordWinningProposal",
    args: [onChainId(input.roundId), onChainId(input.proposalId), BigInt(input.votes)],
  });
  await waitForTransactionReceipt(wagmiConfig, { chainId: input.chainId as 97, hash });
  return hash;
}

/**
 * Release funds to the winning proposal. Resolves with the transaction hash of
 * the confirmed transaction that emitted FundsReleased — callers must only
 * persist `funded` once this resolves.
 */
export async function releaseFunds(input: {
  chainId: number;
  roundId: string;
  proposalId: string;
  recipient: string;
  amount: number;
}) {
  const cfg = requireContract(input.chainId);
  const hash = await writeContract(wagmiConfig, {
    chainId: input.chainId as 97,
    address: cfg.address,
    abi: budgetTreasuryAbi,
    functionName: "releaseFunds",
    args: [
      onChainId(input.roundId),
      onChainId(input.proposalId),
      getAddress(input.recipient),
      parseUnits(String(input.amount), cfg.tokenDecimals),
    ],
  });
  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    chainId: input.chainId as 97,
    hash,
  });
  if (receipt.status !== "success") throw new Error("Fund release transaction reverted on-chain.");
  return { hash, receipt };
}

/** Subscribe to FundsReleased logs for a round. Returns an unsubscribe fn. */
export function watchFundsReleased(input: {
  chainId: number;
  roundId: string;
  onLogs: (logs: Log[]) => void;
}) {
  const cfg = treasuryConfig(input.chainId);
  if (!cfg?.address) return () => {};
  return watchContractEvent(wagmiConfig, {
    chainId: input.chainId as 97,
    address: getAddress(cfg.address),
    abi: budgetTreasuryAbi,
    eventName: "FundsReleased",
    args: { roundId: onChainId(input.roundId) },
    onLogs: (logs) => input.onLogs(logs as unknown as Log[]),
  });
}
