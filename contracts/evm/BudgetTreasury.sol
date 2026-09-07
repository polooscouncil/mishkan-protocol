// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title BudgetTreasury
 * @notice Escrows a budget round's USDC allocation and releases it to the
 *         winning proposal after voting closes.
 *
 * Admin control is intentionally NOT hand-rolled multisig logic. Each round
 * records an admin list, and the expected production configuration is a single
 * audited Gnosis Safe (2-of-3 or better) address in that list: quorum is
 * enforced by the Safe, and every privileged call must originate from it.
 *
 * Round and proposal identifiers are the application's string ids
 * (e.g. "BR-1A2B" / a proposal UUID); they are hashed internally for storage.
 */
contract BudgetTreasury is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Round {
        bool exists;
        IERC20 token;
        uint256 totalAmount;
        uint256 released;
        uint64 votingEnd;
        bytes32 winningProposal;
        uint256 winningVotes;
        bool fundsReleased;
    }

    mapping(bytes32 => Round) private _rounds;
    mapping(bytes32 => EnumerableSet.AddressSet) private _admins;

    event RoundTreasuryCreated(string roundId, uint256 totalAmount, address token, address[] admins);
    event VotingEndRecorded(string roundId, uint64 votingEnd);
    event WinningProposalRecorded(string roundId, string proposalId, uint256 votes);
    event FundsReleased(
        string roundId,
        string proposalId,
        address recipient,
        uint256 amount,
        uint256 timestamp
    );

    error RoundExists();
    error RoundUnknown();
    error NoAdmins();
    error NotRoundAdmin();
    error ReleaseTooEarly();
    error NotWinningProposal();
    error AmountExceedsBudget();
    error InvalidRecipient();
    error AlreadyReleased();

    function key(string memory id) public pure returns (bytes32) {
        return keccak256(bytes(id));
    }

    modifier onlyRoundAdmin(string memory roundId) {
        bytes32 k = key(roundId);
        if (!_rounds[k].exists) revert RoundUnknown();
        if (!_admins[k].contains(msg.sender)) revert NotRoundAdmin();
        _;
    }

    /**
     * @notice Register a round treasury and lock its USDC allocation.
     * @dev The caller must have approved `totalAmount` of `usdcTokenAddress`
     *      to this contract first; the funds are pulled into a balance scoped
     *      to `roundId`.
     * @param admins Addresses allowed to administer the round — use a Gnosis
     *        Safe address so quorum is enforced by the audited Safe.
     */
    function createRoundTreasury(
        string memory roundId,
        uint256 totalAmount,
        address usdcTokenAddress,
        address[] memory admins
    ) external nonReentrant {
        bytes32 k = key(roundId);
        if (_rounds[k].exists) revert RoundExists();
        if (admins.length == 0) revert NoAdmins();
        if (usdcTokenAddress == address(0)) revert InvalidRecipient();

        _rounds[k] = Round({
            exists: true,
            token: IERC20(usdcTokenAddress),
            totalAmount: totalAmount,
            released: 0,
            votingEnd: 0,
            winningProposal: bytes32(0),
            winningVotes: 0,
            fundsReleased: false
        });

        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == address(0)) revert InvalidRecipient();
            _admins[k].add(admins[i]);
        }

        if (totalAmount > 0) {
            IERC20(usdcTokenAddress).safeTransferFrom(msg.sender, address(this), totalAmount);
        }

        emit RoundTreasuryCreated(roundId, totalAmount, usdcTokenAddress, admins);
    }

    /// @notice Record when voting closes; releases are blocked before this.
    function recordVotingEnd(string memory roundId, uint64 votingEnd)
        external
        onlyRoundAdmin(roundId)
    {
        _rounds[key(roundId)].votingEnd = votingEnd;
        emit VotingEndRecorded(roundId, votingEnd);
    }

    /// @notice Record the winning proposal and its endorsement count.
    function recordWinningProposal(string memory roundId, string memory proposalId, uint256 votes)
        external
        onlyRoundAdmin(roundId)
    {
        Round storage round = _rounds[key(roundId)];
        if (round.fundsReleased) revert AlreadyReleased();
        round.winningProposal = key(proposalId);
        round.winningVotes = votes;
        emit WinningProposalRecorded(roundId, proposalId, votes);
    }

    /**
     * @notice Release the round's escrowed USDC to the winning proposal.
     * @dev Gated on: caller is a round admin (Safe), voting has ended, the
     *      proposal is the recorded winner, and no prior release happened.
     */
    function releaseFunds(
        string memory roundId,
        string memory proposalId,
        address recipient,
        uint256 amount
    ) external nonReentrant onlyRoundAdmin(roundId) {
        Round storage round = _rounds[key(roundId)];
        if (round.fundsReleased) revert AlreadyReleased();
        if (round.votingEnd == 0 || block.timestamp < round.votingEnd) revert ReleaseTooEarly();
        if (round.winningProposal == bytes32(0) || key(proposalId) != round.winningProposal) {
            revert NotWinningProposal();
        }
        if (recipient == address(0)) revert InvalidRecipient();
        if (round.released + amount > round.totalAmount) revert AmountExceedsBudget();

        round.released += amount;
        round.fundsReleased = true;
        round.token.safeTransfer(recipient, amount);

        emit FundsReleased(roundId, proposalId, recipient, amount, block.timestamp);
    }

    function roundInfo(string memory roundId)
        external
        view
        returns (
            bool exists,
            address token,
            uint256 totalAmount,
            uint256 released,
            uint64 votingEnd,
            bytes32 winningProposal,
            uint256 winningVotes,
            bool fundsReleased
        )
    {
        Round storage r = _rounds[key(roundId)];
        return (
            r.exists,
            address(r.token),
            r.totalAmount,
            r.released,
            r.votingEnd,
            r.winningProposal,
            r.winningVotes,
            r.fundsReleased
        );
    }

    function isRoundAdmin(string memory roundId, address account) external view returns (bool) {
        return _admins[key(roundId)].contains(account);
    }

    function roundAdmins(string memory roundId) external view returns (address[] memory) {
        return _admins[key(roundId)].values();
    }
}
