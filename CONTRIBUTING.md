# Contributing to Mishkan Protocol

Mishkan Protocol is open-source, public-good infrastructure — contributions
from anyone are welcome, whether or not you're running your own Council.

## How to propose a change

1. **Open an issue first** for anything beyond a small fix — describe the
   problem or feature before writing code, so design direction can be agreed
   on before implementation work starts.
2. **Fork the repo and branch from `main`.**
3. **Keep changes scoped.** One feature or fix per pull request.
4. **If you're adding chain support:** implement the `ChainAdapter` interface
   in `/chains/index.ts` — see `/chains/evm.ts` for a reference implementation.
   New EVM-compatible chains typically need only a config addition, not a new
   adapter; non-EVM chains need a full new adapter.
5. **Open a pull request** against `main` with a clear description of what
   changed and why.

## What we're not looking for

In line with the project's public-good scope (see the README's "What we will
not build" section): no token sale, points programme, or speculative/trading
features. PRs adding these will not be merged.

## Questions

Open an issue for anything unclear — this file will grow as the project does.
