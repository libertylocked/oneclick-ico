/* eslint-disable */
const OneClickICO = artifacts.require("./OneClickICO.sol")

module.exports = (deployer, network, accounts) => {
  deployer.deploy(OneClickICO, accounts[0])
};
