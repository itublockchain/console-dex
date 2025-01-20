const { waitForTx, ethers } = require("./helpers");

async function addLiquidity(tokenA, tokenB, router, deployer) {
  const routerAddress = await router.getAddress();
  const approvalAmount = ethers.parseEther("10000");

  await waitForTx(await tokenA.approve(routerAddress, approvalAmount));
  await waitForTx(await tokenB.approve(routerAddress, approvalAmount));

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now
  const amount = ethers.parseEther("100");

  await waitForTx(
    await router.addLiquidity(
      await tokenA.getAddress(),
      await tokenB.getAddress(),
      amount,
      amount,
      0,
      0,
      deployer.address,
      deadline
    )
  );
}

module.exports = addLiquidity;
