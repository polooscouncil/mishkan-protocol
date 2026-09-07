import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
  watchContractEvent,
} from "@wagmi/core";
import { erc20Abi, getAddress, parseUnits, type Address, type Log } from "viem";
import { bscTestnet } from "viem/chains";
import { wagmiConfig } from "./evm";

/** ABI surface of contracts/evm/BudgetTreasury.sol used by the app. */
export const budgetTreasuryAbi = [
  {
    type: "function",
    name: "createRoundTreasury",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roundId", type: "string" },
      { name: "totalAmount", type: "uint256" },
      { name: "usdcTokenAddress", type: "address" },
      { name: "admins", type: "address[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "recordVotingEnd",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roundId", type: "string" },
      { name: "votingEnd", type: "uint64" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "recordWinningProposal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roundId", type: "string" },
      { name: "proposalId", type: "string" },
      { name: "votes", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "releaseFunds",
    stateMutability: "nonpayable",
    inputs: [
      { name: "roundId", type: "string" },
      { name: "proposalId", type: "string" },
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
      { name: "roundId", type: "string" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "roundInfo",
    stateMutability: "view",
    inputs: [{ name: "roundId", type: "string" }],
    outputs: [
      { name: "exists", type: "bool" },
      { name: "token", type: "address" },
      { name: "totalAmount", type: "uint256" },
      { name: "released", type: "uint256" },
      { name: "votingEnd", type: "uint64" },
      { name: "winningProposal", type: "bytes32" },
      { name: "winningVotes", type: "uint256" },
      { name: "fundsReleased", type: "bool" },
    ],
  },
  {
    type: "event",
    name: "FundsReleased",
    inputs: [
      { name: "roundId", type: "string", indexed: false },
      { name: "proposalId", type: "string", indexed: false },
      { name: "recipient", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
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
  usdcAddress: Address | null;
  tokenDecimals: number;
  explorerTxUrl: (hash: string) => string;
}[] = [
  {
    chainId: bscTestnet.id,
    label: "BNB Chain Testnet",
    address: (import.meta.env['VITE_BUDGET_TREASURY_97'] as Address | undefined) ?? null,
    usdcAddress:
      (import.meta.env['VITE_USDC_97'] as Address | undefined) ??
      ("0x64544969ed7EBf5f083679233325356EbE738930" as Address),
    tokenDecimals: 18,
    explorerTxUrl: (hash) => `https://testnet.bscscan.com/tx/${hash}`,
  },
];

export const DEFAULT_TREASURY_CHAIN_ID = bscTestnet.id;

export function treasuryConfig(chainId: number | null | undefined) {
  return TREASURY_CHAINS.find((c) => c.chainId === (chainId ?? DEFAULT_TREASURY_CHAIN_ID)) ?? null;
}

export function treasuryChainLabel(chainId: number | null | undefined) {
  return treasuryConfig(chainId)?.label ?? `Chain ${chainId ?? "?"}`;
}

/** Explorer link for a transaction hash (BscScan testnet for chain 97). */
export function explorerTxUrl(chainId: number | null | undefined, hash: string) {
  return treasuryConfig(chainId)?.explorerTxUrl(hash) ?? null;
}

/** Public round identifier used both in the UI and on-chain: BR-XXXX. */
export function roundRef(uuid: string) {
  return `BR-${uuid.slice(0, 4).toUpperCase()}`;
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
      args: [roundRef(input.roundId), getAddress(input.account)],
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
    args: [roundRef(input.roundId)],
  })) as readonly [boolean, Address, bigint, bigint, bigint, `0x${string}`, bigint, boolean];
  return {
    exists: result[0],
    token: result[1],
    totalAmount: result[2],
    released: result[3],
    votingEnd: Number(result[4]),
    winningProposal: result[5],
    winningVotes: result[6],
    fundsReleased: result[7],
  };
}

/**
 * Register the round treasury on-chain and lock the round's USDC allocation
 * (draft → open). Approves the treasury for the budget amount first.
 */
export async function createRoundTreasury(input: {
  chainId: number;
  roundId: string;
  totalAmount: number;
  admins: string[];
  votingEnd: string;
}) {
  const cfg = requireContract(input.chainId);
  if (!cfg.usdcAddress) throw new Error(`No USDC token configured for ${cfg.label}.`);
  const ref = roundRef(input.roundId);
  const amount = parseUnits(String(input.totalAmount), cfg.tokenDecimals);
  const usdc = getAddress(cfg.usdcAddress);

  if (amount > 0n) {
    const approveHash = await writeContract(wagmiConfig, {
      chainId: input.chainId as 97,
      address: usdc,
      abi: erc20Abi,
      functionName: "approve",
      args: [cfg.address, amount],
    });
    await waitForTransactionReceipt(wagmiConfig, {
      chainId: input.chainId as 97,
      hash: approveHash,
    });
  }

  const hash = await writeContract(wagmiConfig, {
    chainId: input.chainId as 97,
    address: cfg.address,
    abi: budgetTreasuryAbi,
    functionName: "createRoundTreasury",
    args: [ref, amount, usdc, input.admins.map((a) => getAddress(a))],
  });
  await waitForTransactionReceipt(wagmiConfig, { chainId: input.chainId as 97, hash });

  const votingEndTs = BigInt(Math.floor(new Date(input.votingEnd).getTime() / 1000));
  const endHash = await writeContract(wagmiConfig, {
    chainId: input.chainId as 97,
    address: cfg.address,
    abi: budgetTreasuryAbi,
    functionName: "recordVotingEnd",
    args: [ref, votingEndTs],
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
    args: [roundRef(input.roundId), input.proposalId, BigInt(input.votes)],
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
      roundRef(input.roundId),
      input.proposalId,
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
  const ref = roundRef(input.roundId);
  return watchContractEvent(wagmiConfig, {
    chainId: input.chainId as 97,
    address: getAddress(cfg.address),
    abi: budgetTreasuryAbi,
    eventName: "FundsReleased",
    onLogs: (logs) => {
      const mine = (logs as unknown as { args?: { roundId?: string } }[]).filter(
        (l) => l.args?.roundId === ref,
      );
      if (mine.length > 0) input.onLogs(mine as unknown as Log[]);
    },
  });
}
