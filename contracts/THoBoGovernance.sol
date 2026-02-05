// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./THoBoCoin.sol";

/**
 * @title THoBoGovernance
 * @dev Community governance for THoBoCoin
 */
contract THoBoGovernance is Ownable, ReentrancyGuard {
    
    THoBoCoin public thoboCoin;
    
    enum ProposalType { AddRoom, RemoveRoom, ChangeFee, DistributeRewards, EmergencyAction, Other }
    enum ProposalStatus { Pending, Active, Passed, Rejected, Executed, Cancelled }
    
    struct Proposal {
        uint256 id;
        address proposer;
        ProposalType proposalType;
        string title;
        string description;
        uint256 votingStarts;
        uint256 votingEnds;
        uint256 votesFor;
        uint256 votesAgainst;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 10_000 * 10**18;
    uint256 public constant QUORUM_PERCENTAGE = 10;
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    
    constructor(address _thoboCoinAddress) {
        require(_thoboCoinAddress != address(0), "Invalid address");
        thoboCoin = THoBoCoin(_thoboCoinAddress);
    }
    
    function createProposal(
        ProposalType proposalType,
        string memory title,
        string memory description
    ) external returns (uint256) {
        require(
            thoboCoin.balanceOf(msg.sender) >= MIN_PROPOSAL_THRESHOLD,
            "Insufficient THB"
        );
        require(bytes(title).length > 0, "Title required");
        
        proposalCount++;
        uint256 proposalId = proposalCount;
        
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.proposalType = proposalType;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.votingStarts = block.timestamp;
        newProposal.votingEnds = block.timestamp + VOTING_PERIOD;
        newProposal.status = ProposalStatus.Active;
        
        emit ProposalCreated(proposalId, msg.sender, title);
        return proposalId;
    }
    
    function vote(uint256 proposalId, bool support) external nonReentrant {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.status == ProposalStatus.Active, "Not active");
        require(block.timestamp < proposal.votingEnds, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        uint256 voteWeight = thoboCoin.balanceOf(msg.sender);
        require(voteWeight > 0, "No voting power");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (support) {
            proposal.votesFor += voteWeight;
        } else {
            proposal.votesAgainst += voteWeight;
        }
        
        emit VoteCast(proposalId, msg.sender, support, voteWeight);
    }
    
    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        ProposalType proposalType,
        string memory title,
        string memory description,
        uint256 votingStarts,
        uint256 votingEnds,
        uint256 votesFor,
        uint256 votesAgainst,
        ProposalStatus status
    ) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");
        Proposal storage proposal = proposals[proposalId];
        
        return (
            proposal.proposer,
            proposal.proposalType,
            proposal.title,
            proposal.description,
            proposal.votingStarts,
            proposal.votingEnds,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.status
        );
    }
}
