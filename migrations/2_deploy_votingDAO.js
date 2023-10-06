const VotingDAO = artifacts.require("VotingDAO");

module.exports = function (deployer) {
  deployer.deploy(VotingDAO);
};
