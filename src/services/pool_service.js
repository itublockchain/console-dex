import { ethers } from "hardhat";
import PoolFactoryABI from "../../contracts/PoolFactory.json"

const createPoolService = (poolFactoryAddress, providerOrSigner) => {
  // Create an instance of the PoolFactory contract
  const poolFactory = new ethers.Contract(poolFactoryAddress, PoolFactoryABI.abi, providerOrSigner);

  return {
    getPools: async () => {
      try {
        const Pools = await poolFactory.getAllPools();
        return Pools.map((pool, index) => ({
          id: index,
          poolAddress: pool.poolAddress,
          token_1: pool.tokenChikorita,
          token_2: pool.tokenCynda,
        }));
      } catch (error) {
        console.error("Error fetching pools:", error);
        return [];
      }
    },

    // Fetch a single pool by ID (index)
    getPoolById: async (poolId) => {
      try {
        const pools = await poolFactory.getAllPools();
        const pool = pools[poolId];
        if (!pool) {
          throw new Error(`Pool with ID ${poolId} does not exist`);
        }
        return {
          id: poolId,
          poolAddress: pool.poolAddress,
          token_1: pool.tokenChikorita,
          token_2: pool.tokenCynda,
        };
      } catch (error) {
        console.error(`Error fetching pool with ID ${poolId}:`, error);
        return null;
      }
    },
  };
};

export default createPoolService;
