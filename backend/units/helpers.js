const { ethers } = require("hardhat");

// Common deployment options to ensure consistent gas settings
const deploymentOptions = {
  gasPrice: 3000000000, // 3 gwei fixed gas price
  gasLimit: 3000000,
};

// Helper function to wait for transaction confirmation
async function waitForTx(tx, options = { testMode: true }) {
  if (!options.testMode)
    console.log(`Waiting for transaction ${tx.hash} to be mined...`);
  await tx.wait(1);
  if (!options.testMode) console.log("Transaction confirmed");
}

module.exports = {
  deploymentOptions,
  waitForTx,
  ethers
};
