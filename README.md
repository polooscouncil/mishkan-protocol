# Mishkan Protocol

Build "Mishkan Protocol" — an open-source, multichain community governance app.

It is a generalized, chain-agnostic version of token-gated community deliberation:

any community, on any supported chain, brings their own token and gets a Council.

Pages:

- Docket (home): feed of open items — Community Poll, Dispute Case, Governance Proposal

- Submit: form to open a new poll/dispute/proposal

- Archive: resolved items, permanent public record

- Petitions: routed proposals with a resolution status

- Vision: project mission — open-source public good, multichain by design,

  no native token, community brings their own

- Profile: connected wallet, voting history

Design direction: serious, civic, minimal — think a public record/ledger, not a

crypto trading app. Avoid gimmicky web3 visual clichés. Typography-forward,

generous whitespace, muted palette. This should look like infrastructure,

not a token launch.

Header shows: "Connect wallet" button, current network indicator (which chain

the connected wallet is on), and standard nav (Docket / Submit / Archive /

Petitions / Vision / Profile).

Do not implement wallet connection logic yet — just the UI shell with a

"Connect wallet" button that's wired up in the next step.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mishkanprotocol.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2a3b6d73-e461-40a5-9077-14ffbd2d9a45).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
