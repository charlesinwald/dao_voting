const VotingDAO = artifacts.require('VotingDAO');
const { expect } = require('chai');

contract('VotingDAO', ([owner, voter1, voter2]) => {
  let contract;

  beforeEach(async () => {
    contract = await VotingDAO.new();
  });

  it('should deploy the contract', async () => {
    expect(contract.address).to.exist;
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

  it("should allow viewing votes on a proposal", async function() {
    await contract.createProposal("SVG1", { from: owner });
    await contract.addVoter(voter1, { from: owner });
    await contract.addVoter(voter2, { from: owner });
    await contract.vote(0, true, { from: voter1 });
    await contract.vote(0, false, { from: voter2 });
    const proposal = await contract.proposals(0);
    console.log(proposal);
    expect(proposal.yesVotes.toNumber()).to.equal(1);
    expect(proposal.noVotes.toNumber()).to.equal(1);
  });
});
