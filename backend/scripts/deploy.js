const path = require("node:path");
const fs = require("fs");
const { ethers } = require("../units/helpers");
const deployTokens = require("../units/deployTokens");
const deployFactory = require("../units/deployFactory");
const createPool = require("../units/createPool");
const deployWETH = require("../units/deployWETH");
const deployRouter = require("../units/deployRouter");
const addLiquidity = require("../units/addLiquidity");
const deploySwap = require("../units/deploySwap");

async function main() {
  try {
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log(
      "Account balance:",
      (await ethers.provider.getBalance(deployer.address)).toString()
    );

    // Deploy tokens
    const { tokenA, tokenB, tokenAAddress, tokenBAddress } = await deployTokens(
      deployer
    );

    // Sort token addresses
    const [token0Address, token1Address] =
      tokenAAddress.toLowerCase() < tokenBAddress.toLowerCase()
        ? [tokenAAddress, tokenBAddress]
        : [tokenBAddress, tokenAAddress];

    const token0 =
      tokenAAddress.toLowerCase() === token0Address.toLowerCase()
        ? tokenA
        : tokenB;
    const token1 =
      tokenAAddress.toLowerCase() === token0Address.toLowerCase()
        ? tokenB
        : tokenA;

    // Deploy factory
    const { factory, factoryAddress } = await deployFactory(deployer);

    // Create pool
    const { pairAddress } = await createPool(
      factory,
      token0Address,
      token1Address
    );

    // Deploy WETH
    const { wethAddress } = await deployWETH();

    // Deploy router
    const { router, routerAddress } = await deployRouter(
      factoryAddress,
      wethAddress
    );

    // Add liquidity
    await addLiquidity(token0, token1, router, deployer);

    // Deploy swap contract and perform test swap
    const { swapAddress } = await deploySwap(
      routerAddress,
      wethAddress,
      token0,
      token1,
      deployer
    );

    // Save deployment info
    const deployments = {
      token0: token0Address,
      token1: token1Address,
      factory: factoryAddress,
      router: routerAddress,
      weth: wethAddress,
      pair: pairAddress,
      swap: swapAddress,
    };

    fs.writeFileSync("./addresses.json", JSON.stringify(deployments, null, 2));

    console.log("Deployment addresses:", deployments);
  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
