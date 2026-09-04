# Mishkan EVM contracts

Foundry project for `BudgetTreasury.sol` — escrow + fund release for Budget Rounds.
Admin control is delegated to an audited Gnosis Safe address recorded in the
per-round admin list; no multisig logic is hand-rolled here.

## Setup

```bash
cd contracts/evm
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts
forge test
```

## Deploy (BNB Chain testnet first)

```bash
export BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
export FUNDING_TOKEN=0x...          # ERC20 the round pays out
export DEPLOYER_PRIVATE_KEY=0x...   # funded tBNB account
forge script script/DeployBudgetTreasury.s.sol --rpc-url bsc_testnet --broadcast \
  --private-key $DEPLOYER_PRIVATE_KEY
```

Then set the deployed address in the app: `VITE_BUDGET_TREASURY_97=0x...`
(see `src/lib/chains/treasury.ts`). Only BNB testnet (chain 97) is wired for
now — Ethereum mainnet, Cardano and Stellar adapters are untouched.

## Tests

`test/BudgetTreasury.t.sol` covers the happy path plus the three revert cases:
early release, non-admin caller, and a non-winning proposal.
