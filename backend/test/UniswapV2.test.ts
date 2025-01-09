import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("UniswapV2", function () {
  let factory: Contract;
  let router: Contract;
  let pair: Contract;
  let token0: Contract;
  let token1: Contract;
  let owner: SignerWithAddress;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    // Deploy mock tokens
    const TokenFactory = await ethers.getContractFactory("MockERC20");
    token0 = await TokenFactory.deploy("Token0", "TK0");
    await token0.waitForDeployment();

    token1 = await TokenFactory.deploy("Token1", "TK1");
    await token1.waitForDeployment();

    // Deploy factory
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    factory = await Factory.deploy(owner.address); // owner as feeToSetter
    await factory.waitForDeployment();

    // Deploy router
    const Router = await ethers.getContractFactory("UniswapV2Router02");
    router = await Router.deploy(await factory.getAddress(), owner.address); // owner as WETH for testing
    await router.waitForDeployment();

    // Create pair
    await factory.createPair(
      await token0.getAddress(),
      await token1.getAddress()
    );
    const pairAddress = await factory.getPair(
      await token0.getAddress(),
      await token1.getAddress()
    );
    pair = await ethers.getContractAt("UniswapV2Pair", pairAddress);

    // Mint some tokens to owner
    await token0.mint(owner.address, ethers.parseEther("1000"));
    await token1.mint(owner.address, ethers.parseEther("1000"));

    // Approve router
    await token0.approve(await router.getAddress(), ethers.MaxUint256);
    await token1.approve(await router.getAddress(), ethers.MaxUint256);
  });

  it("Should add liquidity", async function () {
    const amount0 = ethers.parseEther("1");
    const amount1 = ethers.parseEther("1");

    await router.addLiquidity(
      await token0.getAddress(),
      await token1.getAddress(),
      amount0,
      amount1,
      0,
      0,
      owner.address,
      Math.floor(Date.now() / 1000) + 3600
    );

    expect(await pair.balanceOf(owner.address)).to.gt(0);
  });

  it("Should perform swap", async function () {
    // First add liquidity
    const liquidityAmount = ethers.parseEther("5");
    await router.addLiquidity(
      await token0.getAddress(),
      await token1.getAddress(),
      liquidityAmount,
      liquidityAmount,
      0,
      0,
      owner.address,
      Math.floor(Date.now() / 1000) + 3600
    );

    // Get reserves
    const [reserve0, reserve1] = await pair.getReserves();

    // Calculate amounts for swap
    const amountIn = ethers.parseEther("0.1");

    // Calculate amount out with 0.3% fee
    const amountInWithFee = amountIn * BigInt(997);
    const numerator = amountInWithFee * reserve1;
    const denominator = reserve0 * BigInt(1000) + amountInWithFee;
    const amountOut = numerator / denominator;

    // Transfer tokens to pair for swap
    await token0.transfer(await pair.getAddress(), amountIn);

    const balanceBefore = await token1.balanceOf(owner.address);

    // Perform swap
    await pair.swap(
      0, // amount0Out
      amountOut, // amount1Out
      owner.address, // to
      "0x" // data
    );

    const balanceAfter = await token1.balanceOf(owner.address);
    expect(balanceAfter).to.gt(balanceBefore);
  });
});
