const request = require('supertest');
const expect = require('chai').expect;
const app = require('./app');  

describe('Smart Contract API Tests', () => {
  
  const testOwner = "0xa1C26a8Da9758F7f6F1F57e117a88D2eaB3e682c";
  const testVoter = "0xC6B5082Fd37936A9365a9e1566d4272A0ad48073";
  const testProposalId = 1;

  it('should add a voter', async function() {
    this.timeout(4000);
    const res = await request(app)
      .post('/addVoter')
      .send({ owner: testOwner, voterAddress: testVoter });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('transactionHash');
  });

  it('should create a proposal', async () => {
    const res = await request(app)
      .post('/createProposal')
      .send({ owner: testOwner, svg: '<svg>Test SVG</svg>' });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('transactionHash');
  });

  it('should vote on a proposal', async () => {
    const reqBody = { proposalId: testProposalId, vote: true, voterAddress: testVoter };
    const res = await request(app)
      .post('/vote')
      .send(reqBody);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('transactionHash');
  });

  it('should execute a proposal', async () => {
    const res = await request(app)
      .post('/executeProposal')
      .send({ proposalId: testProposalId, owner: testOwner });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('transactionHash');
  });

  it('should view votes on a proposal', async () => {
    const res = await request(app)
      .get(`/viewVotes/${testProposalId}`);
    console.log('res.body', res.body);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('yesVotes');
    expect(res.body).to.have.property('noVotes');
  });

});
