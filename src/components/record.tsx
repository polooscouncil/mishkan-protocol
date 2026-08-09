import {
  KIND_LABEL,
  chainName,
  formatDate,
  formatNumber,
  type Item,
  type ItemKind,
  type ItemStatus,
} from "@/lib/mishkan-data";

const kindColor: Record<ItemKind, string> = {
  poll: "text-poll",
  dispute: "text-dispute",
  proposal: "text-proposal",
};

const statusLabel: Record<ItemStatus, string> = {
  open: "Open",
  passed: "Passed",
  failed: "Failed",
  routed: "Routed",
  withdrawn: "Withdrawn",
};

const statusColor: Record<ItemStatus, string> = {
  open: "text-open",
  passed: "text-passed",
  failed: "text-failed",
  routed: "text-muted-foreground",
  withdrawn: "text-muted-foreground",
};

export function PageHeading({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <div className="max-w-2xl border-b border-rule pb-10">
      <p className="label-caps text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-4 text-4xl leading-[1.1] md:text-5xl">{title}</h1>
      <p className="mt-5 text-base leading-relaxed text-muted-foreground">{lede}</p>
    </div>
  );
}

export function Tally({ item }: { item: Item }) {
  const total = item.tally.for + item.tally.against + item.tally.abstain;
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);

  return (
    <div className="w-full max-w-xs">
      <div className="flex h-1.5 w-full overflow-hidden bg-muted">
        <div style={{ width: `${pct(item.tally.for)}%` }} className="bg-passed" />
        <div style={{ width: `${pct(item.tally.against)}%` }} className="bg-failed" />
        <div style={{ width: `${pct(item.tally.abstain)}%` }} className="bg-muted-foreground/40" />
      </div>
      <dl className="mt-2.5 flex gap-4 font-mono text-[11px] text-muted-foreground">
        <div className="flex gap-1.5">
          <dt>For</dt>
          <dd className="text-foreground">{formatNumber(item.tally.for)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Against</dt>
          <dd className="text-foreground">{formatNumber(item.tally.against)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>Abstain</dt>
          <dd className="text-foreground">{formatNumber(item.tally.abstain)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function ItemRow({ item }: { item: Item }) {
  return (
    <article className="grid grid-cols-1 gap-6 border-b border-rule py-8 md:grid-cols-[9rem_1fr_auto] md:gap-10">
      <div className="flex flex-row items-baseline gap-3 md:flex-col md:gap-2">
        <span className="font-mono text-xs text-muted-foreground">{item.ref}</span>
        <span className={`label-caps ${kindColor[item.kind]}`}>{KIND_LABEL[item.kind]}</span>
        <span className={`label-caps ${statusColor[item.status]} md:mt-1`}>
          {statusLabel[item.status]}
        </span>
      </div>

      <div className="max-w-2xl">
        <h2 className="text-xl leading-snug md:text-2xl">{item.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          {item.community} · {item.token} · {chainName(item.chain)} · opened{" "}
          {formatDate(item.opened)}
          {item.closes ? ` · closes ${formatDate(item.closes)}` : ""}
          {item.resolved ? ` · resolved ${formatDate(item.resolved)}` : ""}
        </p>
        {item.resolution ? (
          <p className="mt-3 border-l-2 border-rule pl-3 text-sm italic text-foreground">
            {item.resolution}
          </p>
        ) : null}
      </div>

      <div className="md:pt-1">
        <Tally item={item} />
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          Turnout {item.turnout.toFixed(1)}% · quorum {item.quorum}%
        </p>
      </div>
    </article>
  );
}
