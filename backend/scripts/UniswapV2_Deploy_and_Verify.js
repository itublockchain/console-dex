const hre = require("hardhat");
const fs = require("fs");
const ethers = hre.ethers;

async function verify(address, constructorArguments) {
  console.log("Waiting for contract bytecode to propagate (30 seconds)...");
  await sleep(30000); // 30 saniye bekle

  console.log("Verifying contract...");
  try {
    // Önce bytecode'un var olduğunu kontrol et
    const bytecode = await ethers.provider.getCode(address);
    if (bytecode === "0x") {
      console.log(
        "Contract bytecode not found yet, waiting another 30 seconds..."
      );
      await sleep(30000);
    }

    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
    });
    console.log("Contract verified successfully");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Contract is already verified!");
    } else {
      console.error("Error verifying contract:", error);
      // Hata durumunda bir kez daha dene
      console.log("Retrying verification in 30 seconds...");
      await sleep(30000);
      try {
        await hre.run("verify:verify", {
          address: address,
          constructorArguments: constructorArguments,
        });
        console.log("Contract verified successfully on second attempt");
      } catch (retryError) {
        console.error("Verification failed after retry:", retryError);
      }
    }
  }
}

async function logBalances(token0, token1, pair, deployer, title) {
  console.log(`\n=== ${title} ===`);
  if (token0 && token1) {
    console.log(
      "Token0 Balance:",
      ethers.formatEther(await token0.balanceOf(deployer.address)),
      "TK0"
    );
    console.log(
      "Token1 Balance:",
      ethers.formatEther(await token1.balanceOf(deployer.address)),
      "TK1"
    );

    if (pair) {
      const pairAddress = await pair.getAddress();
      console.log(
        "Pool Token0 Balance:",
        ethers.formatEther(await token0.balanceOf(pairAddress)),
        "TK0"
      );
      console.log(
        "Pool Token1 Balance:",
        ethers.formatEther(await token1.balanceOf(pairAddress)),
        "TK1"
      );
      const [reserve0, reserve1] = await pair.getReserves();
      console.log(
        "Pool Reserves:",
        ethers.formatEther(reserve0),
        "TK0 /",
        ethers.formatEther(reserve1),
        "TK1"
      );
      console.log(
        "LP Token Balance:",
        ethers.formatEther(await pair.balanceOf(deployer.address)),
        "LP"
      );
    }
  } else {
    console.log("Tokens not yet deployed");
  }

  console.log(
    "ETH Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );
  console.log("================");
}

async function sleep(ms) {
  console.log(`Waiting ${ms / 1000} seconds...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deployContract(contractFactory, name, args = [], nonce) {
  try {
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = (feeData.gasPrice * 150n) / 100n; // %50 artış

    console.log(
      `Deploying ${name} with gas price: ${ethers.formatUnits(
        gasPrice,
        "gwei"
      )} gwei`
    );

    const deploymentOptions = {
      gasPrice: gasPrice,
      nonce: nonce,
    };

    const contract = await contractFactory.deploy(...args, deploymentOptions);
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`${name} deployed to:`, address);

    if (args.length > 0) {
      await sleep(5000);
      await verify(address, args);
    }

    return contract;
  } catch (error) {
    console.error(`Error deploying ${name}:`, error);
    throw error;
  }
}

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    let currentNonce = await ethers.provider.getTransactionCount(
      deployer.address
    );
    console.log("Starting with nonce:", currentNonce);

    await logBalances(null, null, null, deployer, "Initial Balances");

    const INITIAL_MINT = ethers.parseEther("1000");
    const LIQUIDITY_AMOUNT = ethers.parseEther("100");
    const SWAP_AMOUNT = ethers.parseEther("1");

    // 1. Deploy Mock Tokens
    console.log("\n1. Deploying Mock ERC20 Tokens...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");

    const tokenA = await deployContract(
      MockERC20,
      "Token0",
      ["Token0", "TK0"],
      currentNonce++
    );
    await tokenA.mint(deployer.address, INITIAL_MINT, {
      gasPrice: ((await ethers.provider.getFeeData()).gasPrice * 150n) / 100n,
      nonce: currentNonce++,
    });
    console.log(
      "Minted",
      ethers.formatEther(INITIAL_MINT),
      "TokenA to deployer"
    );

    const tokenB = await deployContract(
      MockERC20,
      "Token1",
      ["Token1", "TK1"],
      currentNonce++
    );
    await tokenB.mint(deployer.address, INITIAL_MINT, {
      gasPrice: ((await ethers.provider.getFeeData()).gasPrice * 150n) / 100n,
      nonce: currentNonce++,
    });
    console.log(
      "Minted",
      ethers.formatEther(INITIAL_MINT),
      "TokenB to deployer"
    );

    const tokenAAddress = await tokenA.getAddress();
    const tokenBAddress = await tokenB.getAddress();
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

    await logBalances(token0, token1, null, deployer, "After Token Deployment");

    // 2. Deploy Factory
    console.log("\n2. Deploying UniswapV2Factory...");
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    const factory = await deployContract(
      Factory,
      "UniswapV2Factory",
      [deployer.address],
      currentNonce++
    );

    // 3. Create Pair
    console.log("\n3. Creating Pool for Token0/Token1...");
    await factory.createPair(token0Address, token1Address, {
      gasPrice: ((await ethers.provider.getFeeData()).gasPrice * 150n) / 100n,
      nonce: currentNonce++,
    });
    const pairAddress = await factory.getPair(token0Address, token1Address);
    const pair = await ethers.getContractAt("UniswapV2Pair", pairAddress);
    console.log("Pool created at:", pairAddress);

    // 4. Deploy WETH
    console.log("\n4. Deploying WETH...");
    const WETH = await ethers.getContractFactory("WETH9");
    const weth = await deployContract(WETH, "WETH9", [], currentNonce++);

    // 5. Deploy Router
    console.log("\n5. Deploying UniswapV2Router02...");
    const Router = await ethers.getContractFactory("UniswapV2Router02");
    const router = await deployContract(
      Router,
      "UniswapV2Router02",
      [await factory.getAddress(), await weth.getAddress()],
      currentNonce++
    );

    // 6. Add Initial Liquidity
    console.log("\n6. Adding initial liquidity...");
    console.log(
      "Liquidity amount:",
      ethers.formatEther(LIQUIDITY_AMOUNT),
      "tokens each"
    );

    await logBalances(
      token0,
      token1,
      pair,
      deployer,
      "Before Adding Liquidity"
    );

    await token0.approve(await router.getAddress(), LIQUIDITY_AMOUNT, {
      gasPrice: ((await ethers.provider.getFeeData()).gasPrice * 150n) / 100n,
      nonce: currentNonce++,
    });
    await token1.approve(await router.getAddress(), LIQUIDITY_AMOUNT, {
      gasPrice: ((await ethers.provider.getFeeData()).gasPrice * 150n) / 100n,
      nonce: currentNonce++,
    });
    console.log("Approved tokens for Router");

    const deadline = Math.floor(Date.now() / 1000) + 3600;
    await router.addLiquidity(
      token0Address,
      token1Address,
      LIQUIDITY_AMOUNT,
      LIQUIDITY_AMOUNT,
      (LIQUIDITY_AMOUNT * 95n) / 100n,
      (LIQUIDITY_AMOUNT * 95n) / 100n,
      deployer.address,
      deadline,
      {
        gasPrice: ((await ethers.provider.getFeeData()).gasPrice * 150n) / 100n,
        nonce: currentNonce++,
      }
    );
    console.log("Liquidity added successfully!");

    await logBalances(token0, token1, pair, deployer, "After Adding Liquidity");

    // 7. Test Swap
    console.log("\n7. Performing test swap...");
    console.log("Swap amount:", ethers.formatEther(SWAP_AMOUNT), "Token0");

    const [reserve0, reserve1] = await pair.getReserves();
    const amountInWithFee = SWAP_AMOUNT * 997n;
    const amountOut =
      (amountInWithFee * reserve1) / (reserve0 * 1000n + amountInWithFee);
    console.log("Expected output:", ethers.formatEther(amountOut), "Token1");

    await token0.transfer(pairAddress, SWAP_AMOUNT, {
      gasPrice: ((await ethers.provider.getFeeData()).gasPrice * 150n) / 100n,
      nonce: currentNonce++,
    });
    await pair.swap(0, amountOut, deployer.address, "0x", {
      gasPrice: ((await ethers.provider.getFeeData()).gasPrice * 150n) / 100n,
      nonce: currentNonce++,
    });
    console.log("Swap completed successfully!");

    await logBalances(token0, token1, pair, deployer, "After Swap");

    const deploymentInfo = {
      network: {
        name: hre.network.name,
        chainId: (await ethers.provider.getNetwork()).chainId,
      },
      addresses: {
        token0: token0Address,
        token1: token1Address,
        factory: await factory.getAddress(),
        router: await router.getAddress(),
        weth: await weth.getAddress(),
        pair: pairAddress,
      },
      constructorArgs: {
        token0: ["Token0", "TK0"],
        token1: ["Token1", "TK1"],
        factory: [deployer.address],
        router: [await factory.getAddress(), await weth.getAddress()],
        weth: [],
      },
      amounts: {
        initialMint: ethers.formatEther(INITIAL_MINT),
        liquidityAdded: ethers.formatEther(LIQUIDITY_AMOUNT),
        swapAmount: ethers.formatEther(SWAP_AMOUNT),
      },
      verification: {
        apiUrl: `https://api-holesky.etherscan.io/api`,
        explorerUrl: `https://holesky.etherscan.io/address/`,
      },
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
    };

    const filename = `deployment-${hre.network.name}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment information saved to ${filename}`);
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
