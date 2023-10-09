const VotingDAO = artifacts.require('VotingDAO');
const { expect, assert } = require('chai');

contract('VotingDAO', ([owner, voter1, voter2]) => {
  let contract;

  beforeEach(async () => {
    contract = await VotingDAO.new();
  });

  it('should deploy the contract', async () => {
    expect(contract.address).to.exist;
    console.log(owner, voter1, voter2);
  });

  it('should allow the owner to add a voter', async () => {
    await contract.addVoter(voter1, { from: owner });
    const isVoter = await contract.voters(voter1);
    expect(isVoter).to.be.true;
  });

  it('should allow the owner to create a proposal', async () => {
    await contract.createProposal("Sample SVG", { from: owner });
    const proposal = await contract.proposals(0);
    expect(proposal.svg).to.equal("Sample SVG");
  });

  it('should allow a voter to vote on a proposal', async () => {
    await contract.addVoter(voter1, { from: owner });
    await contract.createProposal("Sample SVG", { from: owner });

    await contract.vote(0, true, { from: voter1 });
    const proposal = await contract.proposals(0);
    expect(proposal.yesVotes.toNumber()).to.equal(1);
  });

  it('should allow the owner to execute a proposal', async () => {
    await contract.addVoter(voter1, { from: owner });
    await contract.createProposal("Sample SVG", { from: owner });

    await contract.vote(0, true, { from: voter1 });

    await contract.executeProposal(0, { from: owner });
    const proposal = await contract.proposals(0);
    expect(proposal.isExecuted).to.be.true;
  });

  // it("should return correct vote counts for a proposal", async () => {
  //   // Create a new proposal (assuming createProposal is a function in your contract)
  //   await contract.createProposal("Proposal 1");
  //   await contract.addVoter(voter1, { from: owner });
  //   await contract.addVoter(voter2, { from: owner });
  //   // Cast some votes (assuming vote is a function in your contract)
  //   await contract.vote(0, true, { from: voter1 }); // yes vote
  //   await contract.vote(0, false, { from: voter2 }); // no vote

  //   // Retrieve the vote counts
  //   const result = await contract.viewVotes(0);
  //   const yesVotes = result[0].toNumber(); // Convert BigNumber to a regular number
  //   const noVotes = result[1].toNumber(); // Convert BigNumber to a regular number

  //   // Verify the vote counts
  //   assert.equal(yesVotes, 1, "Yes votes count should be 2");
  //   assert.equal(noVotes, 1, "No votes count should be 1");
  // });

  it('should return all proposals', async () => {
    await contract.addVoter(owner, { from: owner });
    await contract.createProposal("Sample SVG 1", { from: owner });
    await contract.createProposal("Sample SVG 2", { from: owner });
    
    const proposals = await contract.getAllProposals();
    assert.equal(proposals.svgs[0], "Sample SVG 1", "Proposal 1 SVG should be Sample SVG 1");
    assert.equal(proposals.svgs[1], "Sample SVG 2", "Proposal 2 SVG should be Sample SVG 2");
  });
});
