let pools = [];

async function getPools() {
  return pools;
}

async function getPoolById(poolId) {
  return pools.find((pool) => pool.id === poolId);
}

async function updatePool(pool) {
  try {
    //return await updateDocument("pools", pool.id, pool)
    // find the fittest code

    const index = pools.findIndex((p) => p.id === pool.id);
    if (findIndex >= 0) pools[index] = pool;

    return true;
  } catch (error) {
    console.error("Error updating pool:", error);
    return false;
  }
}

export default {
  getPools,
  getPoolById,
  updatePool,
};
