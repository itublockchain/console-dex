const { waitForTx } = require("./helpers");

async function createPool(factory, token0Address, token1Address) {
  const createPairTx = await factory.createPair(token0Address, token1Address);
  await waitForTx(createPairTx);
  const pairAddress = await factory.getPair(token0Address, token1Address);

  return { pairAddress };
}

module.exports = createPool;
