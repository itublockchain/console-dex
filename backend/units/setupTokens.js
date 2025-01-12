const { ethers } = require("hardhat");

async function setupTokens() {
  const [deployer] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("MockERC20");
  
  const token0 = await Token.deploy("Token0", "TK0");
  await token0.waitForDeployment();
  await token0.mint(deployer.address, ethers.parseEther("1000000"));
  
  const token1 = await Token.deploy("Token1", "TK1");
  await token1.waitForDeployment();
  await token1.mint(deployer.address, ethers.parseEther("1000000"));

  return { token0, token1 };
}

module.exports = setupTokens;
