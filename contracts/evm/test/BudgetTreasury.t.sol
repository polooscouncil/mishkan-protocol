// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {BudgetTreasury} from "../BudgetTreasury.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock", "MOCK") {
        _mint(msg.sender, 1_000_000e18);
    }
}

contract BudgetTreasuryTest is Test {
    BudgetTreasury internal treasury;
    MockToken internal token;

    address internal safe = address(0xA11CE); // stands in for the Gnosis Safe
    address internal outsider = address(0xB0B);
    address internal recipient = address(0xCAFE);

    uint256 internal constant ROUND_ID = 1;
    uint256 internal constant WINNER = 42;
    uint256 internal constant LOSER = 43;
    uint256 internal constant BUDGET = 10_000e18;

    function setUp() public {
        token = new MockToken();
        treasury = new BudgetTreasury(token);
        token.transfer(address(treasury), BUDGET);

        address[] memory admins = new address[](1);
        admins[0] = safe;
        treasury.createRoundTreasury(ROUND_ID, BUDGET, admins);

        vm.startPrank(safe);
        treasury.recordVotingEnd(ROUND_ID, uint64(block.timestamp + 7 days));
        treasury.recordWinningProposal(ROUND_ID, WINNER, 128);
        vm.stopPrank();
    }

    function test_releaseAfterVotingEndByAdminSucceeds() public {
        vm.warp(block.timestamp + 8 days);
        vm.prank(safe);
        treasury.releaseFunds(ROUND_ID, WINNER, recipient, 1_000e18);
        assertEq(token.balanceOf(recipient), 1_000e18);
    }

    function test_revert_releaseBeforeVotingEnd() public {
        vm.prank(safe);
        vm.expectRevert(BudgetTreasury.ReleaseTooEarly.selector);
        treasury.releaseFunds(ROUND_ID, WINNER, recipient, 1_000e18);
    }

    function test_revert_releaseByNonAdmin() public {
        vm.warp(block.timestamp + 8 days);
        vm.prank(outsider);
        vm.expectRevert(BudgetTreasury.NotRoundAdmin.selector);
        treasury.releaseFunds(ROUND_ID, WINNER, recipient, 1_000e18);
    }

    function test_revert_releaseToNonWinningProposal() public {
        vm.warp(block.timestamp + 8 days);
        vm.prank(safe);
        vm.expectRevert(BudgetTreasury.NotWinningProposal.selector);
        treasury.releaseFunds(ROUND_ID, LOSER, recipient, 1_000e18);
    }
}
