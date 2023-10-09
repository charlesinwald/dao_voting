var express = require('express');
var router = express.Router();
const { Web3 } = require('web3');
var bodyParser = require('body-parser');
const cors = require('cors');

// Setup web3 and the contract ABI & Address
const web3 = new Web3('http://localhost:9545');

const fixedOwner = "0xa1C26a8Da9758F7f6F1F57e117a88D2eaB3e682c";

const contractABI = require('../../build/contracts/VotingDAO.json').abi;

async function initializeContract(req, res, next) {
  try {
    const networkId = await web3.eth.net.getId();
    // console.log('Network ID:', networkId);
    const deployedAddress = require('../../build/contracts/VotingDAO.json').networks[networkId].address;
    // console.log('Deployed Address:', deployedAddress);
    req.contract = new web3.eth.Contract(contractABI, deployedAddress);
    // console.log('Contract:', req.contract);
    const accounts = await web3.eth.getAccounts();
    // console.log('Accounts:', accounts);
    next();
  } catch (err) {
    console.error('Error in initializeContract:', err);
    res.status(500).send({ error: 'Failed to initialize contract' });
  }
}
router.use(initializeContract);
router.use(bodyParser.json());

// CORS
router.use(cors({
  origin: 'http://localhost:3001'
}));

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.post('/addVoter', async (req, res) => {
  const { voterAddress } = req.body;
  const addVoter = await req.contract.methods.addVoter(voterAddress).send({ from: fixedOwner });
  res.send({'transactionHash': addVoter.transactionHash});
});

router.post('/createProposal', async (req, res) => {
  const { svg } = req.body;
  const createProposal = await req.contract.methods.createProposal(svg).send({ from: fixedOwner, gas: 2000000  });
  console.log('createProposal', createProposal);
  res.send({'transactionHash': createProposal.transactionHash, 'proposalId': createProposal.proposalId});
});

router.post('/vote', async (req, res) => {
  const { proposalId, vote, voterAddress } = req.body;
  const castVote = await req.contract.methods.vote(proposalId, vote).send({ from: voterAddress });
  res.send({'transactionHash': castVote.transactionHash, 'proposalId': proposalId});
});

router.post('/executeProposal', async (req, res) => {
  const { proposalId } = req.body;
  const executeProposal = await req.contract.methods.executeProposal(proposalId).send({ from: fixedOwner });
  res.send({'transactionHash': executeProposal.transactionHash});
});

router.get('/viewVotes/:proposalId', async (req, res) => {
  const { proposalId } = req.params;
  const proposalIDInt = parseInt(proposalId);
  const proposal = await req.contract.methods.viewVotes(proposalIDInt).call();
  console.log(proposal);
  res.send({'yesVotes': proposal.yesVotes, 'noVotes': proposal.noVotes});
});

router.get('/getAllProposals', async (req, res) => {
  try {
    const output = await req.contract.methods.getAllProposals().call({ from: '0xa1c26a8da9758f7f6f1f57e117a88d2eab3e682c' });

    const svgs = output.svgs;

    const yesVotes = output.yesVotes.map(vote => parseInt(vote));
    const noVotes = output.noVotes.map(vote => parseInt(vote));

    const isExecuted = output.isExecuted;

    // Combine these into an array of proposal objects
    const proposals = svgs.map((svg, index) => ({
      svg,
      yesVotes: yesVotes[index],
      noVotes: noVotes[index],
      isExecuted: isExecuted[index],
    }));

    res.send({ proposals });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    res.status(500).send({ error: "Failed to fetch proposals" });
  }
});

module.exports = router;
