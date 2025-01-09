import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FlashSwap", function () {
  let token0: Contract;
  let token1: Contract;
  let pair: Contract;
  let flashSwap: Contract;
  let owner: SignerWithAddress;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    // Deploy tokens
    const Token = await ethers.getContractFactory("MockERC20");
    token0 = await Token.deploy("Token0", "TK0");
    await token0.waitForDeployment();

    token1 = await Token.deploy("Token1", "TK1");
    await token1.waitForDeployment();

    // Deploy pair
    const Pair = await ethers.getContractFactory("UniswapV2Pair");
    pair = await Pair.deploy();
    await pair.waitForDeployment();

    await pair.initialize(await token0.getAddress(), await token1.getAddress());

    // Deploy flash swap contract
    const FlashSwap = await ethers.getContractFactory("FlashSwapExample");
    flashSwap = await FlashSwap.deploy(await pair.getAddress());
    await flashSwap.waitForDeployment();

    // Mint tokens to owner
    await token0.mint(owner.address, ethers.parseEther("1000"));
    await token1.mint(owner.address, ethers.parseEther("1000"));

    // Approve pair contract
    await token0.approve(pair.getAddress(), ethers.MaxUint256);
    await token1.approve(pair.getAddress(), ethers.MaxUint256);

    // Add liquidity to pair
    await token0.transfer(pair.getAddress(), ethers.parseEther("100"));
    await token1.transfer(pair.getAddress(), ethers.parseEther("100"));
    await pair.mint(owner.address);

    // Approve flash swap contract
    await token0.mint(flashSwap.getAddress(), ethers.parseEther("10")); // For fees
    await token1.mint(flashSwap.getAddress(), ethers.parseEther("10")); // For fees
  });

  it("Should execute flash swap", async function () {
    const amount0Out = ethers.parseEther("1");
    const amount1Out = BigInt(0);

    await flashSwap.startFlashSwap(amount0Out, amount1Out);

    // Check balances after flash swap
    const expectedBalance = ethers.parseEther("100");
    const actualBalance = await token0.balanceOf(pair.getAddress());
    expect(actualBalance).to.be.closeTo(
      expectedBalance,
      ethers.parseEther("0.01") // 1% tolerans
    );

    expect(await token1.balanceOf(pair.getAddress())).to.equal(
      ethers.parseEther("100")
    );
  });
});
