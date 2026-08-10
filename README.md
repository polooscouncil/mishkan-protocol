# Mishkan Protocol

Open-source, multichain infrastructure for community governance. Any community
brings its own token and deploys its own Council — polls, disputes, petitions,
and proposals, verified by token balance, decided one holder, one vote.

**Live app:** https://mishkanprotocol2.lovable.app
**License:** MIT
**Status:** Active MVP development

---

## Why this is a public good

- **No native token.** Mishkan Protocol does not launch, sell, or hold any
  token. There is no sale, no emissions schedule, and no treasury that could
  benefit from the outcome of a vote.
- **No admin custody.** The protocol never holds funds or admin keys for a
  deployed Council. Each instance is scoped to one community's own token.
- **Free, forever, on the core path.** Reading the docket and archive,
  submitting items, and voting carry no fee. Monetization (if any, in the
  future) will live entirely outside core governance — see Roadmap.
- **Self-hostable and forkable.** Any community, on any supported chain, can
  run their own instance without asking permission.

## What it does

| Feature | Description |
|---|---|
| **Docket** | Open feed of Community Polls, Dispute Cases, and Governance Proposals |
| **Submit** | Any wallet holding the community's token can open a new item |
| **Vote** | One holder, one vote — balance verifies eligibility, not voting weight |
| **Archive** | Permanent, append-only record of resolved items |
| **Petitions** | Routed proposals with a tracked resolution status |
| **Feed** | General community discussion, separate from formal docket items |

## Supported chains

Support means balance reads, snapshotting, and record anchoring for a given
chain. Adding a new EVM chain requires configuration only — no new code.
Non-EVM chains require a dedicated adapter.

**Live:**
- BNB Chain (testnet)
- Ethereum (Sepolia)

**Config-ready (EVM-compatible, same adapter):**
- Base, Arbitrum, Polygon, Optimism, Celo

**Planned (requires new adapter):**
- Stellar

## Architecture

```
/chains
  index.ts   -> ChainAdapter interface (connectWallet, getBalance, signVote, isEligible)
  evm.ts     -> EVM implementation (BNB Chain, Ethereum, and any EVM-compatible chain)
  stellar.ts -> Stellar implementation (planned)
```

- **Frontend:** React (via Lovable)
- **Backend:** Supabase — stores docket items, votes, petitions, and feed
  posts; on-chain wallet balance is checked live at vote time, not cached
  as a source of truth for eligibility
- **Multichain:** a single `ChainAdapter` interface — see `/chains/index.ts` —
  that every chain implementation satisfies, so the app never needs to know
  which chain it's talking to

## Roadmap

- [x] Core docket/vote/archive cycle (MVP)
- [x] EVM support (BNB Chain, Ethereum)
- [ ] Stellar adapter
- [ ] Multi-instance hosting (one deployment serving many communities via config)
- [ ] **Futarchy** — ratifying decisions through conditional prediction markets
      ("vote on values, bet on beliefs") as an advisory signal alongside
      simple polling. Exploratory; not yet implemented.

## What we will not build

No token sale. No points programme. No trading surface, price chart, or
speculative incentive layered onto a deliberative body. Governance that pays
to participate stops being governance.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).
