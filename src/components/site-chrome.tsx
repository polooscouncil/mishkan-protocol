import { Link } from "@tanstack/react-router";
import { CHAINS } from "@/lib/mishkan-data";
import { shortAddress, useWallet } from "@/lib/wallet";
import { useActiveCouncil } from "@/lib/active-council";
import { ThemeToggle } from "@/components/theme-toggle";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/", label: "Docket" },
  { to: "/submit", label: "Submit" },
  { to: "/archive", label: "Archive" },
  { to: "/feed", label: "Feed" },
  { to: "/petitions", label: "Petitions" },
  { to: "/vision", label: "Vision" },
  { to: "/profile", label: "Profile" },
] as const;

function LogoMark() {
  return (
    <span
      aria-hidden
      className="flex size-9 items-center justify-center border border-foreground"
    >
      <span className="font-serif text-base leading-none">M</span>
    </span>
  );
}

function CouncilIndicator() {
  const { councils, council, setCouncilId } = useActiveCouncil();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hidden max-w-56 flex-col items-start border-l border-rule pl-4 text-left lg:flex">
        <span className="label-caps text-muted-foreground">Active council</span>
        <span className="mt-0.5 truncate text-sm">
          {council ? council.community_name : "All councils"}
          {council?.token_symbol ? (
            <span className="text-muted-foreground"> · {council.token_symbol}</span>
          ) : null}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <DropdownMenuLabel className="label-caps text-muted-foreground">
          Token-gated communities
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setCouncilId(null)} className="text-sm">
          All councils
        </DropdownMenuItem>
        {councils.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onSelect={() => setCouncilId(c.id)}
            className="justify-between text-sm"
          >
            <span className="truncate">{c.community_name}</span>
            <span className="ml-3 font-mono text-[11px] text-muted-foreground">
              {c.token_symbol ?? "—"}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NetworkIndicator() {
  const { address, chain, chainId, switchChain } = useWallet();
  const label = !address
    ? "No network"
    : chain
      ? chain.name
      : chainId
        ? `Chain ${chainId}`
        : "Unknown network";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hidden flex-col items-start border-l border-rule pl-4 text-left sm:flex">
        <span className="label-caps text-muted-foreground">Chain</span>
        <span className="mt-0.5 flex items-center gap-2 text-sm">
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${
              !address ? "bg-muted-foreground/50" : chain ? "bg-open" : "bg-destructive"
            }`}
          />
          {label}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="label-caps text-muted-foreground">
          Supported networks
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CHAINS.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onSelect={() => void switchChain(c.chainId)}
            className="justify-between font-mono text-xs uppercase tracking-[0.1em]"
          >
            {c.name}
            {c.chainId === chainId ? <span aria-hidden>·</span> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled
          className="justify-between font-mono text-xs uppercase tracking-[0.1em]"
        >
          Stellar
          <span className="text-muted-foreground">Planned</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WalletButton() {
  const { address, available, connect, connecting, disconnect, error } = useWallet();

  if (address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="border border-foreground px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-foreground hover:text-background">
          {shortAddress(address)}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="font-mono text-xs">{address}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => void navigator.clipboard?.writeText(address)}
            className="text-sm"
          >
            Copy address
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={disconnect} className="text-sm">
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void connect()}
      disabled={connecting}
      title={error ?? (available ? undefined : "No browser wallet detected")}
      className="border border-foreground bg-foreground px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.14em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
    >
      {connecting ? "Connecting…" : "Connect wallet"}
    </button>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <LogoMark />
          <span className="flex flex-col">
            <span className="flex items-baseline gap-2">
              <span className="font-serif text-lg leading-none tracking-tight">Mishkan</span>
              <span className="label-caps text-muted-foreground">Protocol</span>
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Community · Deliberation · Record
            </span>
          </span>
        </Link>

        <nav className="order-3 flex w-full flex-wrap items-center gap-x-6 gap-y-2 border-t border-rule pt-3 md:order-none md:w-auto md:border-0 md:pt-0">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-foreground border-foreground" }}
              inactiveProps={{
                className: "text-muted-foreground border-transparent hover:text-foreground",
              }}
              className="border-b py-0.5 text-sm transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <CouncilIndicator />
          <NetworkIndicator />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-baseline md:justify-between">
        <p>Mishkan Protocol · Community deliberation, not legally binding.</p>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link to="/vision" className="transition-colors hover:text-foreground">
            Vision
          </Link>
          <Link to="/status" className="transition-colors hover:text-foreground">
            Status
          </Link>
          <Link to="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl border-t border-rule px-6 py-5">
        <p className="label-caps text-muted-foreground">One holder · one vote.</p>
      </div>
    </footer>
  );
}
