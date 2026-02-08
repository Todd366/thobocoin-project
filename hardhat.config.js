require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");   // ← Modern verification plugin (replaces old etherscan one)
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",   // ← Bump to 0.8.20 (widely compatible in 2026, fixes some optimizer issues)
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      // Optional: evmVersion: "shanghai",  // Uncomment if you want explicit EVM version
    },
  },

  networks: {
    hardhat: {
      chainId: 31337,
    },

    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      // gasPrice: 10000000000,  ← Remove hardcoded unless you really need it (auto-estimate is safer)
    },

    bscMainnet: {
      url: process.env.BSC_MAINNET_RPC || "https://bsc-dataseed1.binance.org",
      chainId: 56,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      // gasPrice: 5000000000,  ← Same, remove unless forced
    },
  },

  etherscan: {
    apiKey: {
      bsc: process.env.BSCSCAN_API_KEY || "G349C2SSXEXQT2W3RHWSJ6Z3WVCDF2VQ9I",  // ← Your key (hardcode for now or keep env)
      bscTestnet: process.env.BSCSCAN_API_KEY || "G349C2SSXEXQT2W3RHWSJ6Z3WVCDF2VQ9I",
    },
    // Optional: customChains if auto-detect fails (rare now)
    customChains: [
      {
        network: "bscTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api-testnet.bscscan.com/api",
          browserURL: "https://testnet.bscscan.com",
        },
      },
      {
        network: "bsc",
        chainId: 56,
        urls: {
          apiURL: "https://api.bscscan.com/api",
          browserURL: "https://bscscan.com",
        },
      },
    ],
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
