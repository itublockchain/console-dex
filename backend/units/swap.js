const { ethers } = require("hardhat");
const { waitForTx } = require("./helpers");
const { getAmountsOut, getAmountsIn } = require("./uniswapLibrary");

async function swapExactTokensForTokens(
  router,
  amountIn,
  amountOutMin,
  path,
  to,
  deadline = Math.floor(Date.now() / 1000) + 60 * 10
) {
  const tx = await router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    path,
    to,
    deadline
  );
  await waitForTx(await tx.wait());
  return tx;
}

async function swapTokensForExactTokens(
  router,
  amountOut,
  amountInMax,
  path,
  to,
  deadline = Math.floor(Date.now() / 1000) + 60 * 10
) {
  const tx = await router.swapTokensForExactTokens(
    amountOut,
    amountInMax,
    path,
    to,
    deadline
  );
  await waitForTx(await tx.wait());
  return tx;
}

async function approveToken(token, spender, amount) {
  const spenderAddress = await spender.getAddress();
  const tx = await token.approve(spenderAddress, amount);
  await waitForTx(await tx.wait());
  return tx;
}

async function getAmountsOutWithRouter(router, amountIn, path) {
  try {
    const factory = await ethers.getContractAt(
      "UniswapV2Factory",
      await router.factory()
    );
    return await getAmountsOut(factory, amountIn, path);
  } catch (error) {
    console.error("Error in getAmountsOut:", error);
    throw error;
  }
}

async function getAmountsInWithRouter(router, amountOut, path) {
  try {
    const factory = await ethers.getContractAt(
      "UniswapV2Factory",
      await router.factory()
    );
    return await getAmountsIn(factory, amountOut, path);
  } catch (error) {
    console.error("Error in getAmountsIn:", error);
    throw error;
  }
}

module.exports = {
  swapExactTokensForTokens,
  swapTokensForExactTokens,
  approveToken,
  getAmountsOut: getAmountsOutWithRouter,
  getAmountsIn: getAmountsInWithRouter,
};
