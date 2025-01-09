import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("UniswapV2 Deployment and Setup", function () {
  let token0: Contract;
  let token1: Contract;
  let factory: Contract;
  let router: Contract;
  let weth: Contract;
  let pair: Contract;
  let deployer: SignerWithAddress;
  let addresses: {
    token0: string;
    token1: string;
    factory: string;
    router: string;
    weth: string;
    pair: string;
  };

  before(async function () {
    [deployer] = await ethers.getSigners();
  });

  it("Should deploy mock tokens", async function () {
    const MockERC20 = await ethers.getContractFactory("MockERC20");

    // Deploy TokenA
    token0 = await MockERC20.deploy("Token0", "TK0");
    await token0.waitForDeployment();
    const token0Address = await token0.getAddress();

    // Mint tokens to deployer
    await token0.mint(deployer.address, ethers.parseEther("1000"));
    expect(await token0.balanceOf(deployer.address)).to.equal(
      ethers.parseEther("1000")
    );

    // Deploy TokenB
    token1 = await MockERC20.deploy("Token1", "TK1");
    await token1.waitForDeployment();
    const token1Address = await token1.getAddress();

    // Mint tokens to deployer
    await token1.mint(deployer.address, ethers.parseEther("1000"));
    expect(await token1.balanceOf(deployer.address)).to.equal(
      ethers.parseEther("1000")
    );

    // Sort token addresses
    const [sortedToken0, sortedToken1] =
      token0Address.toLowerCase() < token1Address.toLowerCase()
        ? [token0, token1]
        : [token1, token0];
    token0 = sortedToken0;
    token1 = sortedToken1;

    addresses = {
      ...addresses,
      token0: await token0.getAddress(),
      token1: await token1.getAddress(),
    };
  });

  it("Should deploy UniswapV2Factory", async function () {
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    factory = await Factory.deploy(deployer.address);
    await factory.waitForDeployment();
    addresses.factory = await factory.getAddress();

    expect(await factory.feeToSetter()).to.equal(deployer.address);
  });

  it("Should create pair", async function () {
    await factory.createPair(addresses.token0, addresses.token1);
    addresses.pair = await factory.getPair(addresses.token0, addresses.token1);
    pair = await ethers.getContractAt("UniswapV2Pair", addresses.pair);

    expect(await pair.token0()).to.equal(addresses.token0);
    expect(await pair.token1()).to.equal(addresses.token1);
  });

  it("Should deploy WETH", async function () {
    const WETH = await ethers.getContractFactory("WETH9");
    weth = await WETH.deploy();
    await weth.waitForDeployment();
    addresses.weth = await weth.getAddress();

    expect(await weth.name()).to.equal("Wrapped Ether");
  });

  it("Should deploy UniswapV2Router02", async function () {
    const Router = await ethers.getContractFactory("UniswapV2Router02");
    router = await Router.deploy(addresses.factory, addresses.weth);
    await router.waitForDeployment();
    addresses.router = await router.getAddress();

    expect(await router.factory()).to.equal(addresses.factory);
    expect(await router.WETH()).to.equal(addresses.weth);
  });

  it("Should add initial liquidity", async function () {
    const amount = ethers.parseEther("100");

    // Approve router
    await token0.approve(addresses.router, amount);
    await token1.approve(addresses.router, amount);

    // Add liquidity
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    await router.addLiquidity(
      addresses.token0,
      addresses.token1,
      amount,
      amount,
      (amount * 95n) / 100n, // 5% slippage
      (amount * 95n) / 100n,
      deployer.address,
      deadline
    );

    // Check liquidity was added
    const liquidityBalance = await pair.balanceOf(deployer.address);
    expect(liquidityBalance).to.be.gt(0);

    // Check reserves
    const [reserve0, reserve1] = await pair.getReserves();
    expect(reserve0).to.equal(amount);
    expect(reserve1).to.equal(amount);
  });

  it("Should perform test swap", async function () {
    const amountIn = ethers.parseEther("1");

    // Calculate amounts for swap
    const [reserve0, reserve1] = await pair.getReserves();
    const amountInWithFee = amountIn * 997n;
    const amountOut =
      (amountInWithFee * reserve1) / (reserve0 * 1000n + amountInWithFee);

    // Transfer tokens to pair
    await token0.transfer(addresses.pair, amountIn);

    // Perform swap
    const balanceBefore = await token1.balanceOf(deployer.address);
    await pair.swap(0, amountOut, deployer.address, "0x");
    const balanceAfter = await token1.balanceOf(deployer.address);

    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("Should save deployment addresses", async function () {
    // Bu adresleri daha sonra kullanmak için kaydedebilirsiniz
    // örneğin bir JSON dosyasına yazabilirsiniz
  });
});
