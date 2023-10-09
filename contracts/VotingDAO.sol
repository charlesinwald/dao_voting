// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract VotingDAO {
    struct Proposal {
        string svg; // the logo content
        uint256 yesVotes;
        uint256 noVotes;
        bool isExecuted;
        mapping(address => bool) hasVoted;
    }

    address public owner;
    mapping(address => bool) public voters;
    Proposal[] public proposals;

    event NewProposal(uint256 indexed proposalId, string svg);
    event Voted(uint256 indexed proposalId, bool vote, address voter);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyVoters() {
        require(voters[msg.sender], "Not a voter");
        _;
    }

    function addVoter(address _voter) public onlyOwner {
        voters[_voter] = true;
    }

    function createProposal(string memory _svg) public onlyOwner returns (uint256) {
        proposals.push();
        Proposal storage newProposal = proposals[proposals.length - 1];
        newProposal.svg = _svg;
        newProposal.yesVotes = 0;
        newProposal.noVotes = 0;
        newProposal.isExecuted = false;

        emit NewProposal(proposals.length - 1, _svg);
        return proposals.length - 1;
    }

    function vote(uint256 _proposalId, bool _vote) public onlyVoters {
        require(_proposalId < proposals.length, "Invalid proposal ID");
        require(!proposals[_proposalId].isExecuted, "Proposal already executed");
        require(!proposals[_proposalId].hasVoted[msg.sender], "Already voted");

        // Mark that this voter has voted on this proposal
        proposals[_proposalId].hasVoted[msg.sender] = true;

        if (_vote) {
            proposals[_proposalId].yesVotes++;
        } else {
            proposals[_proposalId].noVotes++;
        }

        emit Voted(_proposalId, _vote, msg.sender);
    }

    function executeProposal(uint256 _proposalId) public onlyOwner {
        require(_proposalId < proposals.length, "Invalid proposal ID");
        require(!proposals[_proposalId].isExecuted, "Proposal already executed");

        Proposal storage proposal = proposals[_proposalId];

        require(proposal.yesVotes > proposal.noVotes, "Not enough yes votes");

        proposal.isExecuted = true;
    }

    function viewVotes(uint256 _proposalId) public view returns (uint256 yesVotes, uint256 noVotes) {
        Proposal storage proposal = proposals[_proposalId];
        return (proposal.yesVotes, proposal.noVotes);
    }

    function getAllProposals() public view onlyVoters returns (
        string[] memory svgs,
        uint256[] memory yesVotes,
        uint256[] memory noVotes,
        bool[] memory isExecuted
    ) {
        uint256 length = proposals.length;

        svgs = new string[](length);
        yesVotes = new uint256[](length);
        noVotes = new uint256[](length);
        isExecuted = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            Proposal storage proposal = proposals[i];
            svgs[i] = proposal.svg;
            yesVotes[i] = proposal.yesVotes;
            noVotes[i] = proposal.noVotes;
            isExecuted[i] = proposal.isExecuted;
        }
    }
}
