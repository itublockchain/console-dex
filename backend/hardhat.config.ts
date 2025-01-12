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
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    holesky: {
      url: `https://ethereum-holesky-rpc.publicnode.com`,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: "auto",
      gasMultiplier: 1.5,
      timeout: 60_000,
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
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
