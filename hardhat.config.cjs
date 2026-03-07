require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: ["ec91f4a0d466c8cf3f87e34e2051b203759abe985ee2150a78c0a83c7995b9ea"],
      gas: 2100000,
      gasPrice: 10000000000
    }
  }
};

module.exports = config;
