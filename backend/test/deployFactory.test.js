const { expect, ethers, setupTests } = require("./setup");
const deployFactory = require("../units/deployFactory");

setupTests();

describe("DeployFactory", function () {
  let deployer;
  let factory;

  before(async () => {
    [deployer] = await ethers.getSigners();
  });

  it("should deploy factory successfully", async () => {
    const result = await deployFactory(deployer);
    factory = result.factory;
    
    expect(await factory.getAddress()).to.be.properAddress;
  });

  it("should set correct feeToSetter", async () => {
    expect(await factory.feeToSetter()).to.equal(deployer.address);
  });

  it("should initialize with feeTo as zero address", async () => {
    expect(await factory.feeTo()).to.equal(ethers.ZeroAddress);
  });

  it("should allow creating pair", async () => {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token1 = await MockERC20.deploy("Test1", "TST1");
    const token2 = await MockERC20.deploy("Test2", "TST2");

    await factory.createPair(
      await token1.getAddress(),
      await token2.getAddress()
    );

    const pairAddress = await factory.getPair(
      await token1.getAddress(),
      await token2.getAddress()
    );
    expect(pairAddress).to.be.properAddress;
    expect(pairAddress).to.not.equal(ethers.ZeroAddress);
  });
});
