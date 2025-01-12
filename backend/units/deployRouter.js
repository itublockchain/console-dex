const { deploymentOptions, waitForTx, ethers } = require("./helpers");

async function deployRouter(factoryAddress, wethAddress) {
  const Router = await ethers.getContractFactory("UniswapV2Router02");
  const router = await Router.deploy(
    factoryAddress,
    wethAddress,
    deploymentOptions
  );
  await waitForTx(await router.deploymentTransaction());
  const routerAddress = await router.getAddress();

  return { router, routerAddress };
}

module.exports = deployRouter;
