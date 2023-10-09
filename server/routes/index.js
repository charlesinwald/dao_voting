var express = require("express");
var router = express.Router();
const { Web3 } = require("web3");
var bodyParser = require("body-parser");
const cors = require("cors");
const zlib = require("zlib");

// Setup web3 and the contract ABI & Address
const web3 = new Web3("http://localhost:9545");

const fixedOwner = "0xa1C26a8Da9758F7f6F1F57e117a88D2eaB3e682c";

const contractABI = require("../../build/contracts/VotingDAO.json").abi;

// Setup SQLite
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.sqlite");
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS voters (address TEXT PRIMARY KEY)");
  db.run(
    "CREATE TABLE IF NOT EXISTS proposals (id INTEGER PRIMARY KEY AUTOINCREMENT, svg TEXT, executed INTEGER)"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS votes (id INTEGER PRIMARY KEY AUTOINCREMENT, proposal_id INTEGER, vote INTEGER, voter_address TEXT)"
  );
});

const compressSvg = (str) => {
  return zlib.gzipSync(str).toString("base64");
};

const decompressSvg = (str) => {
  const buffer = Buffer.from(str, "base64");
  return zlib.gunzipSync(buffer).toString();
};

async function initializeContract(req, res, next) {
  try {
    const networkId = await web3.eth.net.getId();
    // console.log('Network ID:', networkId);
    const deployedAddress = require("../../build/contracts/VotingDAO.json")
      .networks[networkId].address;
    // console.log('Deployed Address:', deployedAddress);
    req.contract = new web3.eth.Contract(contractABI, deployedAddress);
    // console.log('Contract:', req.contract);
    const accounts = await web3.eth.getAccounts();
    // console.log('Accounts:', accounts);
    const addVoter = await req.contract.methods
      .addVoter("0xa1c26a8da9758f7f6f1f57e117a88d2eab3e682c")
      .send({ from: fixedOwner });
    await req.contract.methods.addVoter(fixedOwner).send({ from: fixedOwner });
    next();
  } catch (err) {
    console.error("Error in initializeContract:", err);
    res.status(500).send({ error: "Failed to initialize contract" });
  }
}
router.use(initializeContract);
router.use(bodyParser.json());

// CORS
router.use(
  cors({
    origin: "http://localhost:3001",
  })
);

router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/addVoter", async (req, res) => {
  const { voterAddress } = req.body;
  try {
    const addVoter = await req.contract.methods
      .addVoter(voterAddress)
      .send({ from: fixedOwner });

    // Insert into SQLite db
    db.run(
      `INSERT OR IGNORE INTO voters (address) VALUES (?)`,
      [voterAddress],
      (err) => {
        if (err) {
          console.error("Database error:", err);
          res.status(500).send({ error: "Database error" });
          return;
        }
      }
    );

    res.send({ transactionHash: addVoter.transactionHash });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT") {
      console.log("Address already exists in the database");
      res.status(400).send({ error: "Address already exists" });
    } else {
      console.log("Error in addVoter:", err);
      res.status(500).send({ error: "Failed to add voter" });
    }
  }
});

router.post("/createProposal", async (req, res) => {
  const svg = compressSvg(req.body.svg);
  console.log("svg", svg);
  const createProposal = await req.contract.methods
    .createProposal(svg)
    .send({ from: fixedOwner, gas: 2000000 });

  // Insert into SQLite db
  db.run(
    `INSERT INTO proposals (svg, executed) VALUES (?, ?)`,
    [svg, 0],
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
    }
  );
  res.send({
    transactionHash: createProposal.transactionHash,
    proposalId: createProposal.proposalId,
  });
});

router.post("/vote", async (req, res) => {
  const { proposalId, vote, voterAddress } = req.body;
  console.log("voterAddress", voterAddress);
  const castVote = await req.contract.methods
    .vote(proposalId, vote)
    .send({ from: voterAddress });
  db.run(
    `INSERT INTO votes (proposal_id, vote, voter_address) VALUES (?, ?, ?)`,
    [proposalId, vote, voterAddress],
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
    }
  );
  res.send({
    transactionHash: castVote.transactionHash,
    proposalId: proposalId,
  });
});

router.post("/executeProposal", async (req, res) => {
  const { proposalId } = req.body;
  const executeProposal = await req.contract.methods
    .executeProposal(proposalId)
    .send({ from: fixedOwner });
  res.send({ transactionHash: executeProposal.transactionHash });
});

router.get("/viewVotes/:proposalId", async (req, res) => {
  const { proposalId } = req.params;
  const proposalIDInt = parseInt(proposalId);
  const proposal = await req.contract.methods.viewVotes(proposalIDInt).call();
  console.log(proposal);
  res.send({ yesVotes: proposal.yesVotes, noVotes: proposal.noVotes });
});

router.get("/getAllProposals", async (req, res) => {
  try {
    // Try to fetch from the SQLite database first
    db.all(`SELECT proposals.id, proposals.svg, proposals.executed,
              SUM(CASE WHEN votes.vote = 1 THEN 1 ELSE 0 END) as yesVotes,
              SUM(CASE WHEN votes.vote = 0 THEN 1 ELSE 0 END) as noVotes
            FROM proposals
            LEFT JOIN votes ON proposals.id = votes.proposal_id
            GROUP BY proposals.id`, [], async (err, rows) => {
      if (err) {
        // If database query fails, then fetch from the blockchain
        const output = await req.contract.methods
          .getAllProposals()
          .call({ from: "0xa1c26a8da9758f7f6f1f57e117a88d2eab3e682c" });

          const svgs = output.svgs;

          const yesVotes = output.yesVotes.map((vote) => parseInt(vote));
          const noVotes = output.noVotes.map((vote) => parseInt(vote));
          const isExecuted = output.isExecuted;
  
          // Combine these into an array of proposal objects
          const proposals = svgs.map((svg, index) => {
            const decompressedSvg = decompressSvg(svg);
            return {
              svg: decompressedSvg,
              yesVotes: yesVotes[index],
              noVotes: noVotes[index],
              isExecuted: isExecuted[index],
            };
          });

        // Successful blockchain query
        res.send({ proposals });
      } else {
        // Decompress SVGs for database rows and format the data
        const decompressedProposals = rows.map(row => {
          const decompressedSvg = decompressSvg(row.svg);
          return {
            svg: decompressedSvg,
            yesVotes: row.yesVotes || 0, // Handle potential NULL from the SQL
            noVotes: row.noVotes || 0, // Handle potential NULL from the SQL
            isExecuted: row.executed === 1 ? true : false
          };
        });

        console.log("Rows:", decompressedProposals);

        // Successful database query
        res.send({ proposals: decompressedProposals });
      }
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    res.status(500).send({ error: "Failed to fetch proposals" });
  }
});


module.exports = router;
