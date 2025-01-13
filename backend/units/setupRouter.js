const { ethers } = require("hardhat");

async function setupRouter() {
  const [deployer] = await ethers.getSigners();
  
  // Deploy WETH
  const WETH = await ethers.getContractFactory("WETH9");
  const weth = await WETH.deploy();
  await weth.waitForDeployment();

  // Deploy Factory
  const Factory = await ethers.getContractFactory("UniswapV2Factory");
  const factory = await Factory.deploy(deployer.address);
  await factory.waitForDeployment();
  
  // Deploy Router with factory and WETH addresses
  const Router = await ethers.getContractFactory("UniswapV2Router02");
  const router = await Router.deploy(
    await factory.getAddress(),
    await weth.getAddress()
  );
  await router.waitForDeployment();

  return { router, factory, weth };
}

module.exports = setupRouter;
