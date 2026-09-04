// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BudgetTreasury} from "../BudgetTreasury.sol";

/**
 * Deploy to BNB Chain testnet:
 *
 *   forge script script/DeployBudgetTreasury.s.sol \
 *     --rpc-url bsc_testnet --broadcast \
 *     --private-key $DEPLOYER_PRIVATE_KEY
 *
 * Env: FUNDING_TOKEN (ERC20 paid out by the treasury).
 */
contract DeployBudgetTreasury is Script {
    function run() external returns (BudgetTreasury treasury) {
        IERC20 token = IERC20(vm.envAddress("FUNDING_TOKEN"));
        vm.startBroadcast();
        treasury = new BudgetTreasury(token);
        vm.stopBroadcast();
    }
}
