const { deploymentOptions, waitForTx, ethers } = require("./helpers");

async function deployTokens(deployer) {
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const tokenA = await MockERC20.deploy("Token0", "TK0", deploymentOptions);
  await waitForTx(await tokenA.deploymentTransaction());
  const tokenAAddress = await tokenA.getAddress();

  await waitForTx(await tokenA.mint(deployer.address, ethers.parseEther("1000")));

  const tokenB = await MockERC20.deploy("Token1", "TK1", deploymentOptions);
  await waitForTx(await tokenB.deploymentTransaction());
  const tokenBAddress = await tokenB.getAddress();

  await waitForTx(await tokenB.mint(deployer.address, ethers.parseEther("1000")));

  return { tokenA, tokenB, tokenAAddress, tokenBAddress };
}

module.exports = deployTokens;
