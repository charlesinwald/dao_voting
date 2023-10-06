// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract VotingDAO {
    struct Proposal {
        string svg;
        uint256 yesVotes;
        uint256 noVotes;
        bool isExecuted;
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

    function createProposal(string memory _svg) public onlyOwner {
        proposals.push(Proposal(_svg, 0, 0, false));
        emit NewProposal(proposals.length - 1, _svg);
    }

    function vote(uint256 _proposalId, bool _vote) public onlyVoters {
        require(_proposalId < proposals.length, "Invalid proposal ID");
        require(!proposals[_proposalId].isExecuted, "Proposal already executed");

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
}
