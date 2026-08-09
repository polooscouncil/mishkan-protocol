import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  disconnectWallet,
  getAccount,
  wagmiConfig,
  watchAccount,
  watchChainId,
  switchEvmChain,
} from "@/lib/chains/evm";
import { getAdapter } from "@/lib/chains";
import type { ChainAdapter } from "@/lib/chains/types";
import { CHAINS, type Chain } from "@/lib/mishkan-data";

export type WalletState = {
  available: boolean;
  address: string | null;
  chainId: number | null;
  chain: Chain | null;
  adapter: ChainAdapter | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
};

const WalletContext = createContext<WalletState | null>(null);

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [available, setAvailable] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAvailable(Boolean((window as { ethereum?: unknown }).ethereum));

    const account = getAccount(wagmiConfig);
    setAddress(account.address ?? null);
    setChainId(account.chainId ?? null);

    const unwatchAccount = watchAccount(wagmiConfig, {
      onChange: (acct) => {
        setAddress(acct.address ?? null);
        setChainId(acct.chainId ?? null);
      },
    });
    const unwatchChain = watchChainId(wagmiConfig, {
      onChange: (id) => setChainId(id ?? null),
    });

    return () => {
      unwatchAccount();
      unwatchChain();
    };
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const adapter = getAdapter(chainId) ?? getAdapter(CHAINS[0]!.chainId)!;
      const { address: connected } = await adapter.connectWallet();
      setAddress(connected);
      const account = getAccount(wagmiConfig);
      setChainId(account.chainId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection rejected.");
    } finally {
      setConnecting(false);
    }
  }, [chainId]);

  const disconnect = useCallback(() => {
    void disconnectWallet(wagmiConfig);
    setAddress(null);
    setError(null);
  }, []);

  const switchChain = useCallback(async (target: number) => {
    setError(null);
    try {
      await switchEvmChain(target);
      setChainId(target);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network switch rejected.");
    }
  }, []);

  const value = useMemo<WalletState>(
    () => ({
      available,
      address,
      chainId,
      chain: CHAINS.find((c) => c.chainId === chainId) ?? null,
      adapter: getAdapter(chainId),
      connecting,
      error,
      connect,
      disconnect,
      switchChain,
    }),
    [available, address, chainId, connecting, error, connect, disconnect, switchChain],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
