const { expect, ethers, setupTests } = require("./setup");
const deployFactory = require("../units/deployFactory");
const deployTokens = require("../units/deployTokens");
const deployRouter = require("../units/deployRouter");
const deployWETH = require("../units/deployWETH");
const addLiquidity = require("../units/addLiquidity");

setupTests();

describe("AddLiquidity", function () {
  let deployer;
  let factory;
  let router;
  let weth;
  let tokenA;
  let tokenB;

  before(async () => {
    [deployer] = await ethers.getSigners();

    // Deploy dependencies
    const factoryResult = await deployFactory(deployer);
    factory = factoryResult.factory;

    const wethResult = await deployWETH();
    weth = wethResult.weth;

    const routerResult = await deployRouter(
      await factory.getAddress(),
      await weth.getAddress()
    );
    router = routerResult.router;

    const tokenResult = await deployTokens(deployer);
    tokenA = tokenResult.tokenA;
    tokenB = tokenResult.tokenB;
  });

  it("should approve tokens for router", async () => {
    await addLiquidity(tokenA, tokenB, router, deployer);

    const routerAddress = await router.getAddress();
    const allowanceA = await tokenA.allowance(deployer.address, routerAddress);
    const allowanceB = await tokenB.allowance(deployer.address, routerAddress);

    expect(allowanceA).to.be.gt(0);
    expect(allowanceB).to.be.gt(0);
  });

  it("should add liquidity successfully", async () => {
    const pairAddress = await factory.getPair(
      await tokenA.getAddress(),
      await tokenB.getAddress()
    );
    const pair = await ethers.getContractAt("UniswapV2Pair", pairAddress);

    const reserves = await pair.getReserves();
    expect(reserves[0]).to.be.gt(0);
    expect(reserves[1]).to.be.gt(0);
  });

  it("should mint LP tokens to the deployer", async () => {
    const pairAddress = await factory.getPair(
      await tokenA.getAddress(),
      await tokenB.getAddress()
    );
    const pair = await ethers.getContractAt("UniswapV2Pair", pairAddress);

    const lpBalance = await pair.balanceOf(deployer.address);
    expect(lpBalance).to.be.gt(0);
  });
});
