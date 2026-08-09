import { CHAINS, chainAccent, chainAccentByChainId } from "@/lib/mishkan-data";

function Dot({ accent }: { accent: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: accent }}
    />
  );
}

/** Small colour-coded chip so a chain can be scanned at a glance. */
export function ChainChip({ chain, className = "" }: { chain: string; className?: string }) {
  const name = CHAINS.find((c) => c.id === chain)?.name ?? chain;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Dot accent={chainAccent(chain)} />
      {name}
    </span>
  );
}

export function ChainChipById({
  chainId,
  label,
  className = "",
}: {
  chainId: number | null | undefined;
  label: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Dot accent={chainAccentByChainId(chainId)} />
      {label}
    </span>
  );
}
