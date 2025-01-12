require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const pre_defined_networks = require("../viem/pre_defined_networks.json");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 400,
      },
    },
  },
  networks: {
    holesky: {
      url: `https://ethereum-holesky-rpc.publicnode.com`,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: "auto",
      gasMultiplier: 1.5, // %50 artış
      timeout: 60_000, // 60 saniye
      confirmations: 5,
    },
    sepolia: {
      url: pre_defined_networks.find((ntw: any) => ntw.name === "sepolia").url,
      accounts: [process.env.PRIVATE_KEY],
      allowUnlimitedContractSize: true,
    },
    local: {
      url: pre_defined_networks.find((ntw: any) => ntw.name === "testnet").url,
      accounts: [process.env.PRIVATE_KEY],
      allowUnlimitedContractSize: true,
    },
  },
  etherscan: {
    apiKey: {
      holesky: process.env.ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "holesky",
        chainId: 17000,
        urls: {
          apiURL: "https://api-holesky.etherscan.io/api",
          browserURL: "https://holesky.etherscan.io",
        },
      },
    ],
  },
};
