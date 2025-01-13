const { deploymentOptions, waitForTx, ethers } = require("./helpers");

async function deployFactory(deployer) {
  const Factory = await ethers.getContractFactory("UniswapV2Factory");
  const factory = await Factory.deploy(deployer.address, deploymentOptions);
  await waitForTx(await factory.deploymentTransaction());
  const factoryAddress = await factory.getAddress();

  return { factory, factoryAddress };
}

module.exports = deployFactory;
