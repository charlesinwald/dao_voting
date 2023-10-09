const request = require('supertest');
const expect = require('chai').expect;
const app = require('./app');  

describe('Smart Contract API Tests', () => {
  
  const testVoter = "0xC6B5082Fd37936A9365a9e1566d4272A0ad48073";
  const testVoter2 = "0x0aC6B5082Fd37936A9365a9e1566d4272A0ad480";
  const testProposalId = 0;

  it('should add a voter', async function() {
    this.timeout(4000);
    const res = await request(app)
      .post('/addVoter')
      .send({ voterAddress: testVoter });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('transactionHash');
  });

  it('should create a proposal', async () => {
    const res = await request(app)
      .post('/createProposal')
      .send({ svg: '<svg>Test SVG</svg>' });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('transactionHash');
  });

  it('should vote on a proposal', async () => {
    const  output = (await request(app)
      .post('/createProposal')
      .send({ svg: '<svg>Test SVG</svg>' }));
      // console.log('output', output);
    const proposalId = output.body.proposalId;
      console.log('proposalId', proposalId);
    await request(app)
      .post('/addVoter')
      .send({ voterAddress: testVoter2 });
      const reqBody = { proposalId: proposalId, vote: true, voterAddress: testVoter2 };
    const res = await request(app)
      .post('/vote')
      .send(reqBody);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('transactionHash');
  });

  it('should execute a proposal', async () => {
    await request(app)
    .post('/createProposal')
    .send({ svg: '<svg>Test SVG</svg>' });
    const res = await request(app)
      .post('/executeProposal')
      .send({ proposalId: testProposalId });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('transactionHash');
  });

  // it('should view votes on a proposal', async () => {
  //   const res = await request(app)
  //     .get(`/viewVotes/${testProposalId}`);
  //   console.log('res.body', res.body);
  //   expect(res.status).to.equal(200);
  //   expect(res.body).to.have.property('yesVotes');
  //   expect(res.body).to.have.property('noVotes');
  // });

  it('should get all proposals', async () => {
    await request(app)
      .post('/addVoter')
      .send({ voterAddress: '0xa1c26a8da9758f7f6f1f57e117a88d2eab3e682c' });
    // await request(app)
    // .post('/createProposal')
    // .send({ svg: '<svg>Test SVG</svg>' });
    const res = await request(app)
      .get('/getAllProposals');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('proposals');
    expect(res.body.proposals).to.be.an('array');
    
    if (res.body.proposals.length > 0) {
      const proposal = res.body.proposals[0];
      expect(proposal).to.have.property('svg');
      expect(proposal).to.have.property('yesVotes');
      expect(proposal).to.have.property('noVotes');
      expect(proposal).to.have.property('isExecuted');
    }
  });

});
