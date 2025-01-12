const { expect } = require("chai");
const { ethers } = require("hardhat");
const sinon = require("sinon");
const helpers = require("../units/helpers");

// Store the original waitForTx
const originalWaitForTx = helpers.waitForTx;

// Setup function to be called before all tests
function setupTests() {
  const provider = ethers.provider;
  provider.on("debug", () => {});

  // Override waitForTx globally for all tests
  helpers.waitForTx = async (tx, options = {}) => {
    return originalWaitForTx(tx, { testMode: true, ...options });
  };
}

module.exports = {
  expect,
  ethers,
  setupTests,
  sinon,
};
