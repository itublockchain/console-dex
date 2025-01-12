const path = require("node:path");
const fs = require("fs");
const { ethers } = require("../units/helpers");
const deployTokens = require("../units/deployTokens");
const deployFactory = require("../units/deployFactory");
const createPool = require("../units/createPool");
const deployWETH = require("../units/deployWETH");
const deployRouter = require("../units/deployRouter");
const addLiquidity = require("../units/addLiquidity");
const { hardhat } = require("viem/chains");

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

    // Save deployment info
    const deployments = {
      token0: token0Address,
      token1: token1Address,
      factory: factoryAddress,
      router: routerAddress,
      weth: wethAddress,
      pair: pairAddress,
    };

    await writeDeployments(deployments);

    console.log("Deployment addresses:", deployments);
  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

async function writeDeployments(deployments) {
  try {
    const file_data = fs.readFileSync("../storage/addresses.json", "utf-8");
    const file = JSON.parse(file_data);

    const network = await ethers.provider.getNetwork();

    file[network.name] = deployments;

    fs.writeFileSync(
      "../storage/addresses.json",
      JSON.stringify(file, null, 2)
    );
  } catch (err) {
    fs.writeFileSync(
      "../storage/addresses.json",
      JSON.stringify(
        {
          sepolia: {},
          testnet: {},
          holesky: {},
        },
        null,
        2
      )
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
