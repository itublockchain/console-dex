const hre = require("hardhat");

const ethers = hre.ethers;

async function main() {
  try {
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log(
      "Account balance:",
      (await ethers.provider.getBalance(deployer.address)).toString()
    );

    // 1. Deploy two ERC20 tokens
    console.log("\n1. Deploying Mock ERC20 Tokens...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");

    const tokenA = await MockERC20.deploy("Token0", "TK0");
    await tokenA.waitForDeployment();
    const tokenAAddress = await tokenA.getAddress();
    console.log("TokenA deployed to:", tokenAAddress);
    // Mint tokens to deployer
    await tokenA.mint(deployer.address, ethers.parseEther("1000"));
    console.log("Minted 1000 TokenA to deployer");

    const tokenB = await MockERC20.deploy("Token1", "TK1");
    await tokenB.waitForDeployment();
    const tokenBAddress = await tokenB.getAddress();
    console.log("TokenB deployed to:", tokenBAddress);
    // Mint tokens to deployer
    await tokenB.mint(deployer.address, ethers.parseEther("1000"));
    console.log("Minted 1000 TokenB to deployer");

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

    // 2. Deploy UniswapV2Factory
    console.log("\n2. Deploying UniswapV2Factory...");
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    const factory = await Factory.deploy(deployer.address);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("UniswapV2Factory deployed to:", factoryAddress);

    // 3. Create a pool on Factory
    console.log("\n3. Creating Pool for Token0/Token1...");
    console.log("Token0 Address:", token0Address);
    console.log("Token1 Address:", token1Address);

    const createPairTx = await factory.createPair(token0Address, token1Address);
    await createPairTx.wait();
    const pairAddress = await factory.getPair(token0Address, token1Address);
    console.log("Pool created at:", pairAddress);

    // 4. Deploy WETH (needed for Router)
    console.log("\n4. Deploying WETH...");
    const WETH = await ethers.getContractFactory("WETH9");
    const weth = await WETH.deploy();
    await weth.waitForDeployment();
    const wethAddress = await weth.getAddress();
    console.log("WETH deployed to:", wethAddress);

    // 5. Deploy UniswapV2Router02
    console.log("\n5. Deploying UniswapV2Router02...");
    const Router = await ethers.getContractFactory("UniswapV2Router02");
    const router = await Router.deploy(factoryAddress, wethAddress);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log("UniswapV2Router02 deployed to:", routerAddress);

    // 6. Add initial liquidity
    console.log("\n6. Adding initial liquidity...");

    // Log balances before
    console.log(
      "Token0 balance before:",
      ethers.formatEther(await token0.balanceOf(deployer.address))
    );
    console.log(
      "Token1 balance before:",
      ethers.formatEther(await token1.balanceOf(deployer.address))
    );

    // Approve router to spend tokens
    const amount = ethers.parseEther("100");
    await token0.approve(routerAddress, amount);
    console.log("Approved Token0 for Router");
    await token1.approve(routerAddress, amount);
    console.log("Approved Token1 for Router");

    // Add liquidity
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    console.log("\nAdding liquidity with parameters:");
    console.log("Token0:", token0Address);
    console.log("Token1:", token1Address);
    console.log("Amount0:", ethers.formatEther(amount));
    console.log("Amount1:", ethers.formatEther(amount));

    const addLiquidityTx = await router.addLiquidity(
      token0Address,
      token1Address,
      amount,
      amount,
      (amount * 95n) / 100n, // %5 slippage tolerance
      (amount * 95n) / 100n, // %5 slippage tolerance
      deployer.address,
      deadline
    );
    await addLiquidityTx.wait();
    console.log("Liquidity added successfully!");

    // Log balances after
    console.log(
      "Token0 balance after:",
      ethers.formatEther(await token0.balanceOf(deployer.address))
    );
    console.log(
      "Token1 balance after:",
      ethers.formatEther(await token1.balanceOf(deployer.address))
    );

    // Log final setup
    console.log("\nFinal Setup:");
    console.log({
      token0: token0Address,
      token1: token1Address,
      factory: factoryAddress,
      router: routerAddress,
      weth: wethAddress,
      pair: pairAddress,
    });
  } catch (error) {
    console.error("Error during deployment:", error);
    console.error("Error details:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
