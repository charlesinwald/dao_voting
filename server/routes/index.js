var express = require('express');
var router = express.Router();
const { Web3 } = require('web3');
var bodyParser = require('body-parser');

// Setup web3 and the contract ABI & Address
const web3 = new Web3('http://localhost:9545');

const contractABI = require('../../build/contracts/VotingDAO.json').abi;

async function initializeContract(req, res, next) {
  const networkId = await web3.eth.net.getId();
  const deployedAddress = require('../../build/contracts/VotingDAO.json').networks[networkId].address;
  req.contract = new web3.eth.Contract(contractABI, deployedAddress);
  const accounts = await web3.eth.getAccounts();
  next();
}
router.use(initializeContract);
router.use(bodyParser.json());

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.post('/addVoter', async (req, res) => {
  const { owner, voterAddress } = req.body;
  const addVoter = await req.contract.methods.addVoter(voterAddress).send({ from: owner });
  res.send({'transactionHash': addVoter.transactionHash});
});

router.post('/createProposal', async (req, res) => {
  const { owner, svg } = req.body;
  const createProposal = await req.contract.methods.createProposal(svg).send({ from: owner });
  res.send({'transactionHash': createProposal.transactionHash});
});

router.post('/vote', async (req, res) => {
  const { proposalId, vote, voterAddress } = req.body;
  const castVote = await req.contract.methods.vote(proposalId, vote).send({ from: voterAddress });
  res.send({'transactionHash': castVote.transactionHash});
});

router.post('/executeProposal', async (req, res) => {
  const { proposalId, owner } = req.body;
  const executeProposal = await req.contract.methods.executeProposal(proposalId).send({ from: owner });
  res.send({'transactionHash': executeProposal.transactionHash});
});

router.get('/viewVotes/:proposalId', async (req, res) => {
  const { proposalId } = req.params;
  const proposalIDInt = parseInt(proposalId);
  const proposal = await req.contract.methods.viewVotes(proposalIDInt).call();
  console.log(proposal);
  res.send({'yesVotes': proposal.yesVotes, 'noVotes': proposal.noVotes});
});

module.exports = router;
