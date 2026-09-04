// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title BudgetTreasury
 * @notice Escrows a budget round's funds and releases them to the winning
 *         proposal after voting closes.
 *
 * Admin control is intentionally NOT hand-rolled multisig logic: each round
 * records an admin list, and the expected production configuration is a single
 * audited Gnosis Safe (2-of-3 or better) address in that list. Every
 * privileged call therefore requires an `msg.sender` that the Safe executes
 * from, and quorum is enforced by the Safe itself.
 */
contract BudgetTreasury is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Round {
        bool exists;
        uint256 totalAmount;
        uint256 released;
        uint64 votingEnd;
        uint256 winningProposalId;
        uint256 winningVotes;
    }

    /// @notice ERC20 the treasury pays out in.
    IERC20 public immutable fundingToken;

    mapping(uint256 => Round) private _rounds;
    mapping(uint256 => EnumerableSet.AddressSet) private _admins;

    event RoundTreasuryCreated(uint256 indexed roundId, uint256 totalAmount, address[] admins);
    event VotingEndRecorded(uint256 indexed roundId, uint64 votingEnd);
    event WinningProposalRecorded(uint256 indexed roundId, uint256 proposalId, uint256 votes);
    event FundsReleased(
        uint256 indexed roundId,
        uint256 indexed proposalId,
        address indexed recipient,
        uint256 amount,
        uint256 votes
    );

    error RoundExists();
    error RoundUnknown();
    error NoAdmins();
    error NotRoundAdmin();
    error ReleaseTooEarly();
    error NotWinningProposal();
    error AmountExceedsBudget();
    error InvalidRecipient();

    constructor(IERC20 token) {
        if (address(token) == address(0)) revert InvalidRecipient();
        fundingToken = token;
    }

    modifier onlyRoundAdmin(uint256 roundId) {
        if (!_rounds[roundId].exists) revert RoundUnknown();
        if (!_admins[roundId].contains(msg.sender)) revert NotRoundAdmin();
        _;
    }

    /**
     * @notice Register a round's treasury budget and its admin list.
     * @param roundId Off-chain budget round identifier.
     * @param totalAmount Maximum releasable amount for this round.
     * @param admins Addresses allowed to administer the round — use a Gnosis
     *        Safe address so quorum is enforced by the audited Safe.
     */
    function createRoundTreasury(uint256 roundId, uint256 totalAmount, address[] memory admins)
        external
    {
        if (_rounds[roundId].exists) revert RoundExists();
        if (admins.length == 0) revert NoAdmins();

        _rounds[roundId] = Round({
            exists: true,
            totalAmount: totalAmount,
            released: 0,
            votingEnd: 0,
            winningProposalId: 0,
            winningVotes: 0
        });

        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == address(0)) revert InvalidRecipient();
            _admins[roundId].add(admins[i]);
        }

        emit RoundTreasuryCreated(roundId, totalAmount, admins);
    }

    /// @notice Record when voting closes; releases are blocked before this.
    function recordVotingEnd(uint256 roundId, uint64 votingEnd) external onlyRoundAdmin(roundId) {
        _rounds[roundId].votingEnd = votingEnd;
        emit VotingEndRecorded(roundId, votingEnd);
    }

    /// @notice Record the winning proposal and its vote count.
    function recordWinningProposal(uint256 roundId, uint256 proposalId, uint256 votes)
        external
        onlyRoundAdmin(roundId)
    {
        _rounds[roundId].winningProposalId = proposalId;
        _rounds[roundId].winningVotes = votes;
        emit WinningProposalRecorded(roundId, proposalId, votes);
    }

    /**
     * @notice Release funds to the winning proposal's recipient.
     * @dev Gated on: voting ended, caller is a round admin (Safe), and the
     *      proposal is the recorded winner.
     */
    function releaseFunds(uint256 roundId, uint256 proposalId, address recipient, uint256 amount)
        external
        nonReentrant
        onlyRoundAdmin(roundId)
    {
        Round storage round = _rounds[roundId];
        if (round.votingEnd == 0 || block.timestamp < round.votingEnd) revert ReleaseTooEarly();
        if (proposalId == 0 || proposalId != round.winningProposalId) revert NotWinningProposal();
        if (recipient == address(0)) revert InvalidRecipient();
        if (round.released + amount > round.totalAmount) revert AmountExceedsBudget();

        round.released += amount;
        fundingToken.safeTransfer(recipient, amount);

        emit FundsReleased(roundId, proposalId, recipient, amount, round.winningVotes);
    }

    function roundInfo(uint256 roundId)
        external
        view
        returns (
            bool exists,
            uint256 totalAmount,
            uint256 released,
            uint64 votingEnd,
            uint256 winningProposalId,
            uint256 winningVotes
        )
    {
        Round storage r = _rounds[roundId];
        return (r.exists, r.totalAmount, r.released, r.votingEnd, r.winningProposalId, r.winningVotes);
    }

    function isRoundAdmin(uint256 roundId, address account) external view returns (bool) {
        return _admins[roundId].contains(account);
    }

    function roundAdmins(uint256 roundId) external view returns (address[] memory) {
        return _admins[roundId].values();
    }
}
