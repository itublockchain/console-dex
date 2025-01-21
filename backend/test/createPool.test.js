const { expect, ethers, setupTests } = require("./setup");
const deployFactory = require("../units/deployFactory");
const deployTokens = require("../units/deployTokens");
const createPool = require("../units/createPool");

setupTests();

describe("CreatePool", function () {
  let deployer;
  let factory;
  let tokenA;
  let tokenB;

  before(async () => {
    [deployer] = await ethers.getSigners();
    
    // Deploy dependencies
    const factoryResult = await deployFactory(deployer);
    factory = factoryResult.factory;
    
    const tokenResult = await deployTokens(deployer);
    tokenA = tokenResult.tokenA;
    tokenB = tokenResult.tokenB;
  });

  it("should create a pool successfully", async () => {
    const result = await createPool(
      factory,
      await tokenA.getAddress(),
      await tokenB.getAddress()
    );
    
    expect(result.pairAddress).to.be.properAddress;
  });

  it("should emit PairCreated event", async () => {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token1 = await MockERC20.deploy("Test1", "TST1");
    const token2 = await MockERC20.deploy("Test2", "TST2");

    await expect(factory.createPair(
      await token1.getAddress(),
      await token2.getAddress()
    )).to.emit(factory, "PairCreated");
  });

  it("should revert when creating pool with same tokens", async () => {
    const tokenAddress = await tokenA.getAddress();
    await expect(
      createPool(factory, tokenAddress, tokenAddress)
    ).to.be.revertedWith("UniswapV2: IDENTICAL_ADDRESSES");
  });
});
