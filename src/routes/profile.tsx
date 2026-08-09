import { createFileRoute } from "@tanstack/react-router";
import { PageHeading } from "@/components/record";
import { KIND_LABEL, VOTE_HISTORY, chainName, formatDate } from "@/lib/mishkan-data";
import { useWallet } from "@/lib/wallet";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Mishkan Protocol" },
      {
        name: "description",
        content:
          "Your connected wallet, Council memberships, and complete voting history across chains.",
      },
      { property: "og:title", content: "Profile — Mishkan Protocol" },
      {
        property: "og:description",
        content: "Connected wallet, memberships, and voting history across chains.",
      },
    ],
  }),
  component: Profile,
});

const MEMBERSHIPS = [
  { community: "Ostrom Commons", token: "12,400 OSTR", chain: "base", weight: "1.24%" },
  { community: "Sanhedrin DAO", token: "3,050 SNHD", chain: "ethereum", weight: "0.31%" },
  { community: "Riverbed Collective", token: "880 RVR", chain: "arbitrum", weight: "0.09%" },
];

function WalletPanel() {
  const { address, available, chain, chainId, connect, connecting, disconnect, error } =
    useWallet();

  return (
    <section className="flex flex-col gap-6 border-b border-rule py-10 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="label-caps text-muted-foreground">Wallet</p>
        <p className="mt-3 font-mono text-lg">{address ?? "Not connected"}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {address
            ? `Network: ${chain?.name ?? (chainId ? `Unrecognised chain ${chainId}` : "unknown")}. Read-only access — voting requires a signature at the time of the vote.`
            : available
              ? "Read-only access. Voting requires a signature at the time of the vote."
              : "No browser wallet detected. Install one to read your memberships."}
        </p>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => (address ? disconnect() : void connect())}
        disabled={connecting}
        className="self-start border border-foreground bg-foreground px-5 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {address ? "Disconnect" : connecting ? "Connecting…" : "Connect wallet"}
      </button>
    </section>
  );
}


function Profile() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <PageHeading
        eyebrow="Member record"
        title="Profile"
        lede="Connect a wallet to read your Council memberships and voting history. Nothing here is stored by the protocol — it is derived from the public record."
      />

      <WalletPanel />


      <section className="py-12">
        <h2 className="text-2xl">Councils</h2>
        <div className="mt-6 border-t border-rule">
          {MEMBERSHIPS.map((m) => (
            <div
              key={m.community}
              className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-rule py-5"
            >
              <span className="text-base">{m.community}</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {m.token} · {chainName(m.chain)} · {m.weight} of voting weight
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-12">
        <h2 className="text-2xl">Voting history</h2>
        <div className="mt-6 border-t border-rule">
          <div className="hidden grid-cols-[6rem_1fr_7rem_10rem_6rem] gap-6 border-b border-rule py-3 md:grid">
            {["Ref", "Item", "Vote", "Weight", "Outcome"].map((h) => (
              <span key={h} className="label-caps text-muted-foreground">
                {h}
              </span>
            ))}
          </div>
          {VOTE_HISTORY.map((v) => (
            <div
              key={v.ref}
              className="grid grid-cols-1 gap-2 border-b border-rule py-5 md:grid-cols-[6rem_1fr_7rem_10rem_6rem] md:items-baseline md:gap-6"
            >
              <span className="font-mono text-xs text-muted-foreground">{v.ref}</span>
              <div>
                <p className="text-base leading-snug">{v.title}</p>
                <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                  {KIND_LABEL[v.kind]} · {chainName(v.chain)} · {formatDate(v.date)}
                </p>
              </div>
              <span className="font-mono text-xs">{v.choice}</span>
              <span className="font-mono text-xs text-muted-foreground">{v.weight}</span>
              <span className="font-mono text-xs text-muted-foreground">{v.outcome}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
