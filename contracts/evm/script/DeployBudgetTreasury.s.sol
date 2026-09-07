// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {BudgetTreasury} from "../BudgetTreasury.sol";

/**
 * Deploy to BNB Chain testnet:
 *
 *   forge script script/DeployBudgetTreasury.s.sol \
 *     --rpc-url bsc_testnet --broadcast \
 *     --private-key $DEPLOYER_PRIVATE_KEY
 *
 * The USDC token address is supplied per round at createRoundTreasury time,
 * so the deployment itself takes no constructor arguments.
 */
contract DeployBudgetTreasury is Script {
    function run() external returns (BudgetTreasury treasury) {
        vm.startBroadcast();
        treasury = new BudgetTreasury();
        vm.stopBroadcast();
    }
}
