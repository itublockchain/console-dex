const { ethers } = require("./helpers");

async function deploySwap(routerAddress, wethAddress, token0, token1, deployer) {
  const Swap = await ethers.getContractFactory("Swap");
  const swap = await Swap.deploy(routerAddress, wethAddress);
  await swap.waitForDeployment();

  const swapAddress = await swap.getAddress();
  console.log("Swap deployed to:", swapAddress);

  return { swap, swapAddress };
}

module.exports = deploySwap;
