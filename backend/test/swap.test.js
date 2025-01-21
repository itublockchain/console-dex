const { expect } = require("chai");
const { ethers } = require("hardhat");
const setupTokens = require("../units/setupTokens");
const setupRouter = require("../units/setupRouter");
const addLiquidity = require("../units/addLiquidity");
const {
  swapExactTokensForTokens,
  swapTokensForExactTokens,
  approveToken,
  getAmountsOut,
  getAmountsIn,
} = require("../units/swap");

describe("Swap", () => {
  let owner;
  let token0;
  let token1;
  let router;
  let factory;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    // Setup tokens
    ({ token0, token1 } = await setupTokens());

    // Setup router and factory
    ({ router, factory } = await setupRouter());

    // Add initial liquidity
    await addLiquidity(
      token0,
      token1,
      router,
      owner
    );
  });

  describe("getAmountsOut", () => {
    it("should calculate correct output amount", async () => {
      const amountIn = ethers.parseEther("1");
      const path = [await token0.getAddress(), await token1.getAddress()];

      const amounts = await getAmountsOut(router, amountIn, path);

      expect(amounts.length).to.equal(2);
      expect(amounts[0]).to.equal(amountIn);
      expect(amounts[1]).to.be.gt(0n);
    });
  });

  describe("getAmountsIn", () => {
    it("should calculate correct input amount", async () => {
      const amountOut = ethers.parseEther("1");
      const path = [await token0.getAddress(), await token1.getAddress()];

      const amounts = await getAmountsIn(router, amountOut, path);

      expect(amounts.length).to.equal(2);
      expect(amounts[1]).to.equal(amountOut);
      expect(amounts[0]).to.be.gt(0n);

      // Verify the calculated input amount produces the desired output
      const outputAmounts = await getAmountsOut(router, amounts[0], path);
      expect(outputAmounts[1]).to.equal(amountOut);
    });
  });
});
