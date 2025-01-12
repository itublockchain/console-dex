const { expect, ethers, setupTests, sinon } = require("./setup");
const { deploymentOptions, waitForTx } = require("../units/helpers");

setupTests();

describe("Helpers", () => {
  describe("deploymentOptions", () => {
    it("should have correct gas settings", () => {
      expect(deploymentOptions.gasPrice).to.equal(3000000000); // 3 gwei
      expect(deploymentOptions.gasLimit).to.equal(3000000);
    });
  });

  describe("ethers", () => {
    it("should be properly imported", () => {
      expect(ethers).to.not.be.undefined;
      expect(ethers.parseEther).to.be.a("function");
    });
  });
});
