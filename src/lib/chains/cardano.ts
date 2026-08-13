import { bech32 } from "bech32";
import type { ChainAdapter, SignedVote, VoteData } from "./types";
import { voteMessage } from "./types";

/**
 * Cardano is not EVM: it needs a dedicated adapter (CIP-30 wallet API for
 * connection and signing, Koios for chain reads). Nothing here goes through
 * the EVM code path.
 */
export const CARDANO_CHAIN_ID = 1815;

/** Wallets we surface, in preference order. */
export const CARDANO_WALLETS = [
  { key: "eternl", name: "Eternl" },
  { key: "lace", name: "Lace" },
] as const;

type Cip30Api = {
  getNetworkId: () => Promise<number>;
  getUsedAddresses: () => Promise<string[]>;
  getUnusedAddresses: () => Promise<string[]>;
  getChangeAddress: () => Promise<string>;
  signData: (address: string, payload: string) => Promise<{ signature: string; key: string }>;
  submitTx?: (tx: string) => Promise<string>;
};

type Cip30Wallet = {
  name?: string;
  enable: () => Promise<Cip30Api>;
  isEnabled: () => Promise<boolean>;
};

function walletRegistry(): Record<string, Cip30Wallet | undefined> {
  if (typeof window === "undefined") return {};
  return ((window as unknown as { cardano?: Record<string, Cip30Wallet> }).cardano ??
    {}) as Record<string, Cip30Wallet | undefined>;
}

export function availableCardanoWallets() {
  const reg = walletRegistry();
  return CARDANO_WALLETS.filter((w) => Boolean(reg[w.key]));
}

export function hasCardanoWallet() {
  return availableCardanoWallets().length > 0;
}

let enabled: Cip30Api | null = null;

async function enableWallet(preferred?: string): Promise<Cip30Api> {
  if (enabled) return enabled;
  const reg = walletRegistry();
  const key = preferred ?? availableCardanoWallets()[0]?.key;
  const wallet = key ? reg[key] : undefined;
  if (!wallet) {
    throw new Error("No Cardano wallet detected. Install Eternl or Lace to continue.");
  }
  enabled = await wallet.enable();
  return enabled;
}

export function resetCardanoConnection() {
  enabled = null;
}

function hexToBytes(hex: string) {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** CIP-30 returns CBOR-hex addresses; the record and Koios both want bech32. */
export function hexAddressToBech32(hex: string) {
  const bytes = hexToBytes(hex);
  const testnet = (bytes[0]! & 0x0f) === 0;
  const prefix = testnet ? "addr_test" : "addr";
  return bech32.encode(prefix, bech32.toWords(bytes), 200);
}

const KOIOS = "https://api.koios.rest/api/v1";

type KoiosAsset = { policy_id: string; asset_name: string | null; quantity: string };

/**
 * Reads the CIP-0113 programmable-token balance held by an address for one
 * policy id. Koios is public and key-free; a Blockfrost project key can be
 * swapped in later without changing this adapter's surface.
 */
export async function readCardanoAssetBalance(policyId: string, address: string) {
  const res = await fetch(`${KOIOS}/address_assets`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ _addresses: [address] }),
  });
  if (!res.ok) throw new Error(`Cardano balance lookup failed (${res.status}).`);
  const rows = (await res.json()) as KoiosAsset[];
  return rows
    .filter((r) => r.policy_id?.toLowerCase() === policyId.toLowerCase())
    .reduce((sum, r) => sum + BigInt(r.quantity || "0"), 0n);
}

export async function connectCardanoWallet(preferred?: string) {
  const api = await enableWallet(preferred);
  const used = await api.getUsedAddresses();
  const hex = used[0] ?? (await api.getChangeAddress());
  return { address: hexAddressToBech32(hex), hex, api };
}

/**
 * Cardano adapter. Voting is off-chain and gasless — the wallet signs the vote
 * payload with CIP-30 signData, mirroring the EVM signMessage path.
 */
export function createCardanoAdapter(): ChainAdapter {
  return {
    chainId: "cardano:mainnet",

    async connectWallet() {
      const { address } = await connectCardanoWallet();
      return { address };
    },

    async getBalance(policyId: string, walletAddress: string) {
      return readCardanoAssetBalance(policyId, walletAddress);
    },

    async signVote(vote: VoteData): Promise<SignedVote> {
      const api = await enableWallet();
      const used = await api.getUsedAddresses();
      const hex = used[0] ?? (await api.getChangeAddress());
      const message = voteMessage(vote);
      const payload = bytesToHex(new TextEncoder().encode(message));
      const { signature } = await api.signData(hex, payload);
      return { message, signature, chainId: CARDANO_CHAIN_ID };
    },

    async isEligible(policyId: string, walletAddress: string, minBalance: bigint) {
      const balance = await this.getBalance(policyId, walletAddress);
      return balance >= minBalance;
    },
  };
}

/**
 * Self-claim attestation for the "Join Council" flow. The member signs the
 * claim with their own wallet and submits the self-paid claim transaction from
 * that same wallet — the protocol never holds keys and never distributes
 * tokens on anyone's behalf.
 */
export async function signCardanoClaim(input: {
  councilId: string;
  policyId: string;
  messageTag: string;
}) {
  const { address, hex, api } = await connectCardanoWallet();
  const message = [
    "Mishkan Protocol — council claim",
    `Tag: ${input.messageTag}`,
    `Council: ${input.councilId}`,
    `Policy: ${input.policyId}`,
    `Claimant: ${address}`,
  ].join("\n");
  const payload = bytesToHex(new TextEncoder().encode(message));
  const { signature } = await api.signData(hex, payload);
  return { address, message, signature };
}
