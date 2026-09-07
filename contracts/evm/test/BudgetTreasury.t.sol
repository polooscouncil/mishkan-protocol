// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {BudgetTreasury} from "../BudgetTreasury.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000e6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract BudgetTreasuryTest is Test {
    BudgetTreasury internal treasury;
    MockUSDC internal usdc;

    address internal safe = address(0xA11CE); // stands in for the 2-of-3 Gnosis Safe
    address internal outsider = address(0xB0B);
    address internal recipient = address(0xCAFE);

    string internal constant ROUND_ID = "BR-1A2B";
    string internal constant WINNER = "proposal-winner";
    string internal constant LOSER = "proposal-loser";
    uint256 internal constant BUDGET = 10_000e6;

    function setUp() public {
        usdc = new MockUSDC();
        treasury = new BudgetTreasury();

        address[] memory admins = new address[](1);
        admins[0] = safe;

        usdc.approve(address(treasury), BUDGET);
        treasury.createRoundTreasury(ROUND_ID, BUDGET, address(usdc), admins);

        vm.startPrank(safe);
        treasury.recordVotingEnd(ROUND_ID, uint64(block.timestamp + 7 days));
        treasury.recordWinningProposal(ROUND_ID, WINNER, 128);
        vm.stopPrank();
    }

    function test_createLocksUsdc() public view {
        assertEq(usdc.balanceOf(address(treasury)), BUDGET);
    }

    function test_releaseAfterVotingEndByAdminSucceeds() public {
        vm.warp(block.timestamp + 8 days);
        vm.prank(safe);
        treasury.releaseFunds(ROUND_ID, WINNER, recipient, 1_000e6);
        assertEq(usdc.balanceOf(recipient), 1_000e6);
    }

    function test_revert_releaseBeforeVotingEnd() public {
        vm.prank(safe);
        vm.expectRevert(BudgetTreasury.ReleaseTooEarly.selector);
        treasury.releaseFunds(ROUND_ID, WINNER, recipient, 1_000e6);
    }

    function test_revert_releaseByNonAdmin() public {
        vm.warp(block.timestamp + 8 days);
        vm.prank(outsider);
        vm.expectRevert(BudgetTreasury.NotRoundAdmin.selector);
        treasury.releaseFunds(ROUND_ID, WINNER, recipient, 1_000e6);
    }

    function test_revert_releaseToNonWinningProposal() public {
        vm.warp(block.timestamp + 8 days);
        vm.prank(safe);
        vm.expectRevert(BudgetTreasury.NotWinningProposal.selector);
        treasury.releaseFunds(ROUND_ID, LOSER, recipient, 1_000e6);
    }

    function test_revert_doubleRelease() public {
        vm.warp(block.timestamp + 8 days);
        vm.startPrank(safe);
        treasury.releaseFunds(ROUND_ID, WINNER, recipient, 1_000e6);
        vm.expectRevert(BudgetTreasury.AlreadyReleased.selector);
        treasury.releaseFunds(ROUND_ID, WINNER, recipient, 1_000e6);
        vm.stopPrank();
    }
}
