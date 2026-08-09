export type ItemKind = "poll" | "dispute" | "proposal";
export type ItemStatus = "open" | "passed" | "failed" | "routed" | "withdrawn";

export type Chain = {
  id: string;
  name: string;
  short: string;
  chainId: number;
  /** CSS custom property holding the chain's scanning accent. */
  accent: string;
  live: boolean;
};

export const CHAINS: Chain[] = [
  { id: "bnb-testnet", name: "BNB Chain Testnet", short: "tBNB", chainId: 97, accent: "var(--chain-bnb)", live: true },
  { id: "sepolia", name: "Ethereum Sepolia", short: "SEP", chainId: 11155111, accent: "var(--chain-ethereum)", live: true },
  { id: "ethereum", name: "Ethereum", short: "ETH", chainId: 1, accent: "var(--chain-ethereum)", live: true },
  { id: "base", name: "Base", short: "BASE", chainId: 8453, accent: "var(--chain-base)", live: true },
  { id: "arbitrum", name: "Arbitrum One", short: "ARB", chainId: 42161, accent: "var(--chain-arbitrum)", live: true },
  { id: "polygon", name: "Polygon", short: "POL", chainId: 137, accent: "var(--chain-polygon)", live: true },
  { id: "optimism", name: "OP Mainnet", short: "OP", chainId: 10, accent: "var(--chain-optimism)", live: true },
  { id: "celo", name: "Celo", short: "CELO", chainId: 42220, accent: "var(--chain-celo)", live: true },
];

/** Non-EVM chains need a dedicated adapter — listed, but not live. */
export const UPCOMING_CHAINS = [
  { id: "stellar", name: "Stellar", short: "XLM", accent: "var(--chain-stellar)" },
] as const;

export function chainAccent(id: string | null | undefined) {
  return CHAINS.find((c) => c.id === id)?.accent ?? "var(--color-muted-foreground)";
}

export function chainAccentByChainId(chainId: number | null | undefined) {
  return CHAINS.find((c) => c.chainId === chainId)?.accent ?? "var(--color-muted-foreground)";
}

export const KIND_LABEL: Record<ItemKind, string> = {
  poll: "Community Poll",
  dispute: "Dispute Case",
  proposal: "Governance Proposal",
};

/** Subtle tinted badge per item type — fill + border, never full-card colour. */
export const KIND_BADGE: Record<ItemKind, string> = {
  poll: "border-poll/35 bg-poll/10 text-poll",
  dispute: "border-dispute/35 bg-dispute/10 text-dispute",
  proposal: "border-proposal/35 bg-proposal/10 text-proposal",
};

export const KIND_BAR: Record<ItemKind, string> = {
  poll: "bg-poll",
  dispute: "bg-dispute",
  proposal: "bg-proposal",
};

/** Status colour coding shared by Docket, Archive, and Petitions. */
export type StatusTone = "open" | "pending" | "resolved" | "returned" | "neutral";

export const STATUS_BADGE: Record<StatusTone, string> = {
  open: "border-open/35 bg-open/10 text-open",
  pending: "border-pending/40 bg-pending/12 text-pending",
  resolved: "border-passed/35 bg-passed/10 text-passed",
  returned: "border-returned/40 bg-returned/12 text-returned",
  neutral: "border-rule bg-muted text-muted-foreground",
};

export function statusTone(status: string): StatusTone {
  switch (status) {
    case "open":
    case "in deliberation":
      return "open";
    case "pending review":
      return "pending";
    case "resolved":
    case "passed":
      return "resolved";
    case "returned":
    case "withdrawn":
    case "failed":
      return "returned";
    default:
      return "neutral";
  }
}

export type Item = {
  id: string;
  ref: string;
  kind: ItemKind;
  status: ItemStatus;
  title: string;
  summary: string;
  community: string;
  token: string;
  chain: string;
  opened: string;
  closes?: string;
  resolved?: string;
  quorum: number;
  turnout: number;
  tally: { for: number; against: number; abstain: number };
  resolution?: string;
};

export const ITEMS: Item[] = [
  {
    id: "1",
    ref: "MP-0142",
    kind: "proposal",
    status: "open",
    title: "Establish a standing treasury review every 90 days",
    summary:
      "Requires the Council to publish a full accounting of treasury inflows and outflows on a fixed quarterly cadence, with a mandatory public comment window before ratification.",
    community: "Ostrom Commons",
    token: "OSTR",
    chain: "base",
    opened: "2026-07-24",
    closes: "2026-08-07",
    quorum: 12,
    turnout: 18.4,
    tally: { for: 612_400, against: 88_100, abstain: 41_000 },
  },
  {
    id: "2",
    ref: "MP-0141",
    kind: "dispute",
    status: "open",
    title: "Contested delegation transfer by member 0x4c…9e21",
    summary:
      "A delegation was reassigned after the snapshot block. The claimant requests the Council void the reassignment and restore the prior delegate for the duration of the cycle.",
    community: "Sanhedrin DAO",
    token: "SNHD",
    chain: "ethereum",
    opened: "2026-07-28",
    closes: "2026-08-05",
    quorum: 8,
    turnout: 6.2,
    tally: { for: 121_000, against: 96_500, abstain: 12_300 },
  },
  {
    id: "3",
    ref: "MP-0140",
    kind: "poll",
    status: "open",
    title: "Should grant reporting be monthly or per-milestone?",
    summary:
      "A non-binding temperature check to inform the drafting of the grants charter. Results are advisory and carry no execution authority.",
    community: "Riverbed Collective",
    token: "RVR",
    chain: "arbitrum",
    opened: "2026-07-30",
    closes: "2026-08-09",
    quorum: 5,
    turnout: 11.7,
    tally: { for: 44_800, against: 21_200, abstain: 9_900 },
  },
  {
    id: "4",
    ref: "MP-0139",
    kind: "proposal",
    status: "open",
    title: "Lower the proposal threshold from 1% to 0.25% of supply",
    summary:
      "Widens the right of initiative to smaller holders while retaining the existing quorum and the seven-day deliberation minimum.",
    community: "Ostrom Commons",
    token: "OSTR",
    chain: "base",
    opened: "2026-07-21",
    closes: "2026-08-04",
    quorum: 12,
    turnout: 24.9,
    tally: { for: 402_100, against: 511_700, abstain: 63_400 },
  },
  {
    id: "5",
    ref: "MP-0138",
    kind: "poll",
    status: "open",
    title: "Preferred cadence for Council office hours",
    summary:
      "Members select among weekly, biweekly, and monthly open sessions. The outcome sets the default schedule for the coming two cycles.",
    community: "Terra Nova Assembly",
    token: "TNVA",
    chain: "celo",
    opened: "2026-08-01",
    closes: "2026-08-12",
    quorum: 5,
    turnout: 3.1,
    tally: { for: 18_600, against: 4_100, abstain: 7_700 },
  },
  {
    id: "6",
    ref: "MP-0137",
    kind: "dispute",
    status: "open",
    title: "Alleged misuse of the emergency pause by a multisig signer",
    summary:
      "Members request review of a unilateral pause executed outside the documented emergency criteria, and clarification of the remedy available to affected participants.",
    community: "Sanhedrin DAO",
    token: "SNHD",
    chain: "ethereum",
    opened: "2026-07-19",
    closes: "2026-08-06",
    quorum: 8,
    turnout: 14.8,
    tally: { for: 288_300, against: 74_900, abstain: 33_100 },
  },
  {
    id: "7",
    ref: "MP-0136b",
    kind: "proposal",
    status: "open",
    title: "Fund a two-cycle pilot for delegate accountability reports",
    summary:
      "Allocates 45,000 OP from the community fund for a pilot in which every active delegate publishes a short voting rationale each cycle, reviewed by an independent rapporteur.",
    community: "Harbour Guild",
    token: "HRBR",
    chain: "optimism",
    opened: "2026-07-27",
    closes: "2026-08-10",
    quorum: 10,
    turnout: 9.6,
    tally: { for: 214_500, against: 63_800, abstain: 27_400 },
  },
  {
    id: "8",
    ref: "MP-0135b",
    kind: "poll",
    status: "open",
    title: "Which language should the charter be translated into first?",
    summary:
      "Advisory poll to prioritise translation work. Members rank Spanish, Portuguese, and Bahasa Indonesia for the first officially maintained charter translation.",
    community: "Terra Nova Assembly",
    token: "TNVA",
    chain: "polygon",
    opened: "2026-07-31",
    closes: "2026-08-14",
    quorum: 5,
    turnout: 7.4,
    tally: { for: 31_200, against: 6_400, abstain: 15_100 },
  },
  {
    id: "9",
    ref: "MP-0134b",
    kind: "dispute",
    status: "open",
    title: "Disputed grant milestone sign-off by the Infrastructure Stewards",
    summary:
      "A grantee contests the rejection of milestone two, arguing the acceptance criteria were altered after the grant agreement was signed. Remedy sought: independent review and release of withheld funds.",
    community: "Riverbed Collective",
    token: "RVR",
    chain: "arbitrum",
    opened: "2026-07-23",
    closes: "2026-08-08",
    quorum: 5,
    turnout: 12.9,
    tally: { for: 52_700, against: 47_900, abstain: 8_300 },
  },
  {
    id: "10",
    ref: "MP-0133b",
    kind: "proposal",
    status: "open",
    title: "Cap Council terms at three consecutive cycles",
    summary:
      "Introduces mandatory rotation so no member may serve more than three consecutive cycles, with eligibility restored after one cycle out of office.",
    community: "Sanhedrin DAO",
    token: "SNHD",
    chain: "ethereum",
    opened: "2026-07-18",
    closes: "2026-08-11",
    quorum: 8,
    turnout: 27.3,
    tally: { for: 498_600, against: 302_400, abstain: 55_800 },
  },
];


export const ARCHIVE: Item[] = [
  {
    id: "a1",
    ref: "MP-0136",
    kind: "proposal",
    status: "passed",
    title: "Adopt a written record requirement for all Council decisions",
    summary:
      "Every resolution must be accompanied by a written rationale entered into the permanent record before execution.",
    community: "Ostrom Commons",
    token: "OSTR",
    chain: "base",
    opened: "2026-06-30",
    resolved: "2026-07-14",
    quorum: 12,
    turnout: 31.2,
    tally: { for: 918_200, against: 61_400, abstain: 22_000 },
    resolution: "Ratified. Effective from cycle 22.",
  },
  {
    id: "a2",
    ref: "MP-0135",
    kind: "dispute",
    status: "failed",
    title: "Claim of improper quorum count in cycle 20",
    summary:
      "Claimant argued abstentions were wrongly excluded from quorum. The Council found the count consistent with the charter as written.",
    community: "Sanhedrin DAO",
    token: "SNHD",
    chain: "ethereum",
    opened: "2026-06-22",
    resolved: "2026-07-05",
    quorum: 8,
    turnout: 19.6,
    tally: { for: 141_000, against: 402_800, abstain: 51_200 },
    resolution: "Dismissed. Charter amendment invited separately.",
  },
  {
    id: "a3",
    ref: "MP-0134",
    kind: "poll",
    status: "passed",
    title: "Temperature check on multichain Council mirroring",
    summary:
      "Advisory poll on mirroring Council records across a second chain for redundancy.",
    community: "Riverbed Collective",
    token: "RVR",
    chain: "arbitrum",
    opened: "2026-06-18",
    resolved: "2026-06-28",
    quorum: 5,
    turnout: 15.3,
    tally: { for: 88_400, against: 12_100, abstain: 14_600 },
    resolution: "Advisory support recorded. Routed to drafting.",
  },
  {
    id: "a4",
    ref: "MP-0133",
    kind: "proposal",
    status: "withdrawn",
    title: "Introduce a protocol-level fee on Council actions",
    summary:
      "Withdrawn by the author after deliberation surfaced conflicts with the no-native-token principle.",
    community: "Terra Nova Assembly",
    token: "TNVA",
    chain: "celo",
    opened: "2026-06-11",
    resolved: "2026-06-16",
    quorum: 5,
    turnout: 4.4,
    tally: { for: 9_800, against: 31_200, abstain: 2_400 },
    resolution: "Withdrawn by author before close.",
  },
  {
    id: "a5",
    ref: "MP-0132",
    kind: "dispute",
    status: "passed",
    title: "Restoration of voting rights after erroneous delisting",
    summary:
      "Council found the delisting was an indexing error and ordered restoration retroactive to the affected snapshot.",
    community: "Ostrom Commons",
    token: "OSTR",
    chain: "base",
    opened: "2026-06-02",
    resolved: "2026-06-13",
    quorum: 12,
    turnout: 22.8,
    tally: { for: 640_100, against: 40_300, abstain: 18_900 },
    resolution: "Upheld. Rights restored retroactively.",
  },
];

export type PetitionStage = {
  label: string;
  date: string | null;
  detail: string;
};

export type Petition = {
  id: string;
  ref: string;
  title: string;
  community: string;
  chain: string;
  routedTo: string;
  filed: string;
  signatures: number;
  threshold: number;
  resolution: "pending review" | "in deliberation" | "resolved" | "returned";
  note: string;
  body: string[];
  timeline: PetitionStage[];
  resolutionText?: string;
};

export const PETITIONS: Petition[] = [
  {
    id: "p1",
    ref: "PET-0031",
    title: "Publish all Council votes with per-member attribution",
    community: "Ostrom Commons",
    chain: "base",
    routedTo: "Records Committee",
    filed: "2026-07-26",
    signatures: 1_842,
    threshold: 2_000,
    resolution: "pending review",
    note: "Awaiting signature threshold before the Council must docket it.",
    body: [
      "The petitioners request that every Council vote be published with per-member attribution, so that any member can see how each seat voted on each item without reconstructing it from chain data.",
      "Attribution is already implicit in the signature record. Publishing it in the archive interface simply makes the existing record legible, and allows members to hold individual seats accountable at the end of a term.",
      "The petition asks the Records Committee to specify a format, a publication deadline after each close, and a retention rule ensuring attributions are never amended after the fact.",
    ],
    timeline: [
      { label: "Filed", date: "2026-07-26", detail: "Opened by a member of Ostrom Commons and entered into the public record." },
      { label: "Threshold met", date: null, detail: "1,842 of 2,000 signatures collected. The Council is not yet obliged to docket it." },
      { label: "Routed to committee", date: null, detail: "On threshold, routing to the Records Committee is automatic." },
      { label: "Resolution", date: null, detail: "A written resolution will be published here once the committee answers." },
    ],
  },
  {
    id: "p2",
    ref: "PET-0030",
    title: "Extend deliberation minimum from seven to ten days",
    community: "Sanhedrin DAO",
    chain: "ethereum",
    routedTo: "Charter Working Group",
    filed: "2026-07-12",
    signatures: 3_410,
    threshold: 2_500,
    resolution: "in deliberation",
    note: "Threshold met. Docketed as MP-0144 for the coming cycle.",
    body: [
      "Petitioners argue that the seven-day deliberation minimum systematically disadvantages members in time zones and working patterns that do not align with the drafting group.",
      "The proposed remedy is a ten-day minimum for charter-level items, retaining seven days for advisory polls, so that routine temperature checks are not slowed by a rule aimed at constitutional change.",
      "The Charter Working Group has been asked to return either a drafted amendment or a written explanation of why the current minimum should stand.",
    ],
    timeline: [
      { label: "Filed", date: "2026-07-12", detail: "Opened by a member of Sanhedrin DAO." },
      { label: "Threshold met", date: "2026-07-19", detail: "3,410 of 2,500 signatures. Routing became mandatory." },
      { label: "Routed to committee", date: "2026-07-21", detail: "Assigned to the Charter Working Group and docketed as MP-0144." },
      { label: "Resolution", date: null, detail: "Deliberation is open. A written answer is due at the close of the cycle." },
    ],
  },
  {
    id: "p3",
    ref: "PET-0029",
    title: "Mirror the archive to a permanent content-addressed store",
    community: "Riverbed Collective",
    chain: "arbitrum",
    routedTo: "Infrastructure Stewards",
    filed: "2026-06-29",
    signatures: 2_970,
    threshold: 1_500,
    resolution: "resolved",
    note: "Adopted. Archive mirroring live since 12 July 2026.",
    body: [
      "The archive is the protocol's product. Petitioners requested that it be mirrored to a content-addressed store so that no single host can silently alter or withdraw a resolved record.",
      "The petition specified that mirroring be continuous rather than periodic, and that each mirrored entry publish its content hash alongside the record in the interface.",
    ],
    timeline: [
      { label: "Filed", date: "2026-06-29", detail: "Opened by a member of Riverbed Collective." },
      { label: "Threshold met", date: "2026-07-02", detail: "2,970 of 1,500 signatures." },
      { label: "Routed to committee", date: "2026-07-04", detail: "Assigned to the Infrastructure Stewards." },
      { label: "Resolution", date: "2026-07-12", detail: "Adopted in full. Mirroring is live." },
    ],
    resolutionText:
      "Adopted without amendment. Continuous mirroring to a content-addressed store went live on 12 July 2026, and every archive entry now publishes its content hash. The Stewards are directed to report any mirroring outage on the Status page within one hour.",
  },
  {
    id: "p4",
    ref: "PET-0028",
    title: "Create a paid Council stipend funded by treasury yield",
    community: "Terra Nova Assembly",
    chain: "celo",
    routedTo: "Treasury Committee",
    filed: "2026-06-15",
    signatures: 620,
    threshold: 1_200,
    resolution: "returned",
    note: "Returned to author. Insufficient signatures within the 30-day window.",
    body: [
      "The petition proposed a recurring stipend for seated Council members, funded from treasury yield rather than from a protocol fee.",
      "Deliberation surfaced concern that a stipend funded by treasury performance creates an interest in treasury growth that may not align with the community's stated priorities.",
      "The petition did not reach its signature threshold within the thirty-day window and was returned to its author without prejudice; it may be refiled.",
    ],
    timeline: [
      { label: "Filed", date: "2026-06-15", detail: "Opened by a member of Terra Nova Assembly." },
      { label: "Threshold met", date: null, detail: "620 of 1,200 signatures at the close of the window." },
      { label: "Routed to committee", date: null, detail: "Routing to the Treasury Committee was never triggered." },
      { label: "Resolution", date: "2026-07-15", detail: "Returned to the author when the window lapsed." },
    ],
    resolutionText:
      "Returned to the author. The petition lapsed for want of signatures on 15 July 2026 and was not considered on its merits. It may be refiled at any time without prejudice.",
  },
];

export function petitionById(id: string) {
  return PETITIONS.find((p) => p.id === id || p.ref.toLowerCase() === id.toLowerCase());
}

export type VoteRecord = {
  ref: string;
  title: string;
  kind: ItemKind;
  chain: string;
  choice: "For" | "Against" | "Abstain";
  weight: string;
  date: string;
  outcome: string;
};

export const VOTE_HISTORY: VoteRecord[] = [
  {
    ref: "MP-0142",
    title: "Establish a standing treasury review every 90 days",
    kind: "proposal",
    chain: "base",
    choice: "For",
    weight: "12,400 OSTR",
    date: "2026-07-25",
    outcome: "Open",
  },
  {
    ref: "MP-0139",
    title: "Lower the proposal threshold from 1% to 0.25% of supply",
    kind: "proposal",
    chain: "base",
    choice: "Against",
    weight: "12,400 OSTR",
    date: "2026-07-22",
    outcome: "Open",
  },
  {
    ref: "MP-0136",
    title: "Adopt a written record requirement for all Council decisions",
    kind: "proposal",
    chain: "base",
    choice: "For",
    weight: "11,900 OSTR",
    date: "2026-07-03",
    outcome: "Passed",
  },
  {
    ref: "MP-0135",
    title: "Claim of improper quorum count in cycle 20",
    kind: "dispute",
    chain: "ethereum",
    choice: "Abstain",
    weight: "3,050 SNHD",
    date: "2026-06-27",
    outcome: "Dismissed",
  },
  {
    ref: "MP-0134",
    title: "Temperature check on multichain Council mirroring",
    kind: "poll",
    chain: "arbitrum",
    choice: "For",
    weight: "880 RVR",
    date: "2026-06-21",
    outcome: "Passed",
  },
];

export function chainName(id: string) {
  return CHAINS.find((c) => c.id === id)?.name ?? id;
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
