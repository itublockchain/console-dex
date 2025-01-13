const { deploymentOptions, waitForTx, ethers } = require("./helpers");

async function deployWETH() {
  const WETH = await ethers.getContractFactory("WETH9");
  const weth = await WETH.deploy(deploymentOptions);
  await waitForTx(await weth.deploymentTransaction());
  const wethAddress = await weth.getAddress();

  return { weth, wethAddress };
}

module.exports = deployWETH;
