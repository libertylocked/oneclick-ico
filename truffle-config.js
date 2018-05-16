// const HDWalletProvider = require('truffle-hdwallet-provider')

module.exports = {
  solc: {
    optimizer: {
      enabled: true,
      runs: 100
    }
  },
  networks: {
    development: {
      host: 'localhost',
      port: 7545,
      gas: 6000000,
      network_id: 5777
    },
    ropsten: {
      // provider: function() {
      //   return new HDWalletProvider(seedPhrase, 'https://ropsten.infura.io/metamask', 1)
      // },
      gas: 4600000,
      gasPrice: 1000000000,
      network_id: 3
    }
  }
};
