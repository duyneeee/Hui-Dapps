const HDWalletProvider = require('@truffle/hdwallet-provider');
// Thay thế bằng mnemonic thực từ Ganache của bạn
const mnemonic = 'your_mnemonic_phrase_from_ganache_here'; 

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Địa chỉ Ganache
      port: 7545,            // Port mặc định của Ganache GUI (8545 cho Ganache-CLI)
      network_id: "*",       // Match any network id
      gas: 6000000,
      gasPrice: 20000000000
    }
  },
  compilers: {
    solc: {
      version: "0.8.0",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};