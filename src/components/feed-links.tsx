import { useState } from "react";
import { Rss } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const FEEDS = [
  { key: "rss", label: "RSS", path: "/rss.xml" },
  { key: "atom", label: "Atom", path: "/atom.xml" },
] as const;

function absolute(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, path: string) => {
    try {
      await navigator.clipboard?.writeText(absolute(path));
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch {
      setCopied(null);
    }
  };
  return { copied, copy };
}

export function FeedMenu() {
  const { copied, copy } = useCopy();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Subscribe via RSS or Atom"
        title="Subscribe via RSS or Atom"
        className="flex size-8 items-center justify-center border border-rule text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
      >
        <Rss className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="label-caps text-muted-foreground">
          Subscribe to the record
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {FEEDS.map((f) => (
          <DropdownMenuItem
            key={f.key}
            onSelect={(e) => {
              e.preventDefault();
              void copy(f.key, f.path);
            }}
            className="justify-between text-sm"
          >
            <span>Copy {f.label} URL</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {copied === f.key ? "Copied" : f.path}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {FEEDS.map((f) => (
          <DropdownMenuItem key={`open-${f.key}`} asChild className="text-sm">
            <a href={f.path} target="_blank" rel="noreferrer">
              Open {f.label} feed
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FeedDiscovery() {
  const { copied, copy } = useCopy();

  return (
    <section className="border-b border-rule py-8">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="mt-1 flex size-9 shrink-0 items-center justify-center border border-rule text-muted-foreground"
        >
          <Rss className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="label-caps text-muted-foreground">Syndication</p>
          <h2 className="mt-2 text-xl">Follow the docket in a feed reader</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Open items and petitions are published as machine-readable feeds. Copy a URL into
            any reader to track the record as it changes.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {FEEDS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => void copy(f.key, f.path)}
                className="flex items-center gap-3 border border-rule px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                <span className="text-foreground">{f.label}</span>
                <span>{f.path}</span>
                <span className="text-foreground">{copied === f.key ? "Copied" : "Copy"}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
