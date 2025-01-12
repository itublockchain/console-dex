const { expect, ethers, setupTests } = require("./setup");
const deployFactory = require("../units/deployFactory");
const deployRouter = require("../units/deployRouter");
const deployWETH = require("../units/deployWETH");

setupTests();

describe("DeployRouter", function () {
  let deployer;
  let factory;
  let weth;
  let router;

  before(async () => {
    [deployer] = await ethers.getSigners();
    
    // Deploy dependencies first
    const factoryResult = await deployFactory(deployer);
    factory = factoryResult.factory;
    
    const wethResult = await deployWETH();
    weth = wethResult.weth;
  });

  it("should deploy router successfully", async () => {
    const result = await deployRouter(
      await factory.getAddress(),
      await weth.getAddress()
    );
    router = result.router;
    
    expect(await router.getAddress()).to.be.properAddress;
  });

  it("should have correct factory address", async () => {
    expect(await router.factory()).to.equal(await factory.getAddress());
  });

  it("should have correct WETH address", async () => {
    expect(await router.WETH()).to.equal(await weth.getAddress());
  });

  it("should be able to add liquidity", async () => {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Test", "TST");
    await token.mint(deployer.address, ethers.parseEther("100"));
    
    // Mint some WETH
    await weth.deposit({ value: ethers.parseEther("10") });
    
    // Approve both tokens
    await token.approve(await router.getAddress(), ethers.parseEther("100"));
    await weth.approve(await router.getAddress(), ethers.parseEther("10"));
    
    // Add liquidity
    const tx = await router.addLiquidity(
      await token.getAddress(),
      await weth.getAddress(),
      ethers.parseEther("1"),
      ethers.parseEther("1"),
      0,
      0,
      deployer.address,
      ethers.MaxUint256
    );
    
    await tx.wait();
    expect(tx).to.emit(factory, "PairCreated");
  });
});
