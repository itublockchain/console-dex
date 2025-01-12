require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const pre_defined_networks = require("../storage/pre_defined_networks.json");

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
      url: `https://1rpc.io/holesky`,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 3000000000, // 3 gwei fixed gas price
      timeout: 60_000,
      allowUnlimitedContractSize: true,
      confirmations: 5,
    },
    sepolia: {
      url: pre_defined_networks.find((ntw: any) => ntw.name === "sepolia").url,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 3000000000, // 3 gwei fixed gas price
      timeout: 60_000,
      allowUnlimitedContractSize: true,
      confirmations: 5,
    },
    testnet: {
      url: pre_defined_networks.find((ntw: any) => ntw.name === "testnet").url,
      accounts: [process.env.PRIVATE_KEY],
      allowUnlimitedContractSize: true,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
