const { expect, ethers, setupTests } = require("./setup");
const deployTokens = require("../units/deployTokens");

setupTests();

describe("DeployTokens", function () {
  let deployer;
  let tokenA;
  let tokenB;

  before(async () => {
    [deployer] = await ethers.getSigners();
  });

  it("should deploy both tokens successfully", async () => {
    const result = await deployTokens(deployer);
    tokenA = result.tokenA;
    tokenB = result.tokenB;

    expect(await tokenA.getAddress()).to.be.properAddress;
    expect(await tokenB.getAddress()).to.be.properAddress;
  });

  it("should set correct token names and symbols", async () => {
    expect(await tokenA.name()).to.equal("Token0");
    expect(await tokenA.symbol()).to.equal("TK0");
    expect(await tokenB.name()).to.equal("Token1");
    expect(await tokenB.symbol()).to.equal("TK1");
  });

  it("should mint correct amount of tokens to deployer", async () => {
    const balanceA = await tokenA.balanceOf(deployer.address);
    const balanceB = await tokenB.balanceOf(deployer.address);

    expect(balanceA).to.equal(ethers.parseEther("1000"));
    expect(balanceB).to.equal(ethers.parseEther("1000"));
  });
});
