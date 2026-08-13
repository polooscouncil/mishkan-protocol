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
import { getAdapter, CARDANO_CHAIN_ID } from "@/lib/chains";
import {
  connectCardanoWallet,
  hasCardanoWallet,
  resetCardanoConnection,
} from "@/lib/chains/cardano";
import type { ChainAdapter } from "@/lib/chains/types";
import { CHAINS, type Chain } from "@/lib/mishkan-data";

export type ChainFamily = "evm" | "cardano";

export type WalletState = {
  available: boolean;
  address: string | null;
  chainId: number | null;
  chain: Chain | null;
  family: ChainFamily;
  adapter: ChainAdapter | null;
  connecting: boolean;
  error: string | null;
  connect: (family?: ChainFamily) => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
};

const WalletContext = createContext<WalletState | null>(null);

export function shortAddress(address: string) {
  if (address.startsWith("addr")) return `${address.slice(0, 12)}…${address.slice(-6)}`;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [evmAvailable, setEvmAvailable] = useState(false);
  const [cardanoAvailable, setCardanoAvailable] = useState(false);
  const [family, setFamily] = useState<ChainFamily>("evm");
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [cardanoAddress, setCardanoAddress] = useState<string | null>(null);
  const [evmChainId, setEvmChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setEvmAvailable(Boolean((window as { ethereum?: unknown }).ethereum));
    setCardanoAvailable(hasCardanoWallet());

    const account = getAccount(wagmiConfig);
    setEvmAddress(account.address ?? null);
    setEvmChainId(account.chainId ?? null);

    const unwatchAccount = watchAccount(wagmiConfig, {
      onChange: (acct) => {
        setEvmAddress(acct.address ?? null);
        setEvmChainId(acct.chainId ?? null);
      },
    });
    const unwatchChain = watchChainId(wagmiConfig, {
      onChange: (id) => setEvmChainId(id ?? null),
    });

    return () => {
      unwatchAccount();
      unwatchChain();
    };
  }, []);

  const chainId = family === "cardano" ? CARDANO_CHAIN_ID : evmChainId;
  const address = family === "cardano" ? cardanoAddress : evmAddress;

  const connect = useCallback(
    async (target?: ChainFamily) => {
      const fam = target ?? family;
      setFamily(fam);
      setConnecting(true);
      setError(null);
      try {
        if (fam === "cardano") {
          const { address: connected } = await connectCardanoWallet();
          setCardanoAddress(connected);
        } else {
          const adapter = getAdapter(evmChainId) ?? getAdapter(CHAINS[0]!.chainId)!;
          const { address: connected } = await adapter.connectWallet();
          setEvmAddress(connected);
          setEvmChainId(getAccount(wagmiConfig).chainId ?? null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Connection rejected.");
      } finally {
        setConnecting(false);
      }
    },
    [family, evmChainId],
  );

  const disconnect = useCallback(() => {
    if (family === "cardano") {
      resetCardanoConnection();
      setCardanoAddress(null);
    } else {
      void disconnectWallet(wagmiConfig);
      setEvmAddress(null);
    }
    setError(null);
  }, [family]);

  const switchChain = useCallback(
    async (target: number) => {
      setError(null);
      if (target === CARDANO_CHAIN_ID) {
        setFamily("cardano");
        if (!cardanoAddress) await connect("cardano");
        return;
      }
      setFamily("evm");
      try {
        await switchEvmChain(target);
        setEvmChainId(target);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network switch rejected.");
      }
    },
    [cardanoAddress, connect],
  );

  const value = useMemo<WalletState>(
    () => ({
      available: family === "cardano" ? cardanoAvailable : evmAvailable,
      address,
      chainId,
      chain: CHAINS.find((c) => c.chainId === chainId) ?? null,
      family,
      adapter: getAdapter(chainId),
      connecting,
      error,
      connect,
      disconnect,
      switchChain,
    }),
    [
      address,
      chainId,
      family,
      evmAvailable,
      cardanoAvailable,
      connecting,
      error,
      connect,
      disconnect,
      switchChain,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
