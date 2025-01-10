import ViemPool from "../../viem/functions/pool.js";
import AuthManager from "../managers/auth_manager.js";

function initializeNetwork() {
  ViemPool.network = AuthManager.network;
}

async function getPools() {
  initializeNetwork();

  const pools = await ViemPool.getPools();

  return pools;
}

async function getPoolByName(pool_name) {
  initializeNetwork();
  const pools = await ViemPool.getPools();
  return pools.find(({ name }) => name === pool_name);
}

async function getFactoryContract() {
  initializeNetwork();

  const factory = await ViemPool.initializeFactory();
  try {
    await factory.read.feeTo();
    return factory.address;
  } catch (error) {}
  return null;
}

async function updatePool(pool) {
  try {
    const index = pools.findIndex((p) => p.id === pool.id);
    if (findIndex >= 0) pools[index] = pool;

    return true;
  } catch (error) {
    console.error("Error updating pool:", error);
    return false;
  }
}

async function addLiquidity(pool_address, token_address, amount) {
  const private_key = await AuthManager.getPrivateKey();
  initializeNetwork();

  return await ViemPool.addLiquidity(
    pool_address,
    token_address,
    amount,

    private_key
  );
}

async function swap(pool_address, token_in_address, amount) {
  const private_key = await AuthManager.getPrivateKey();

  initializeNetwork();

  return await ViemPool.swap(
    pool_address,
    token_in_address,
    amount,
    private_key
  );
}

export default {
  getPools,
  getPoolByName,
  updatePool,
  getFactoryContract,
  addLiquidity,
  swap,
};
