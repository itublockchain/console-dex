import { ViemPool } from "../../viem/functions/factory.js";
import AuthManager from "../managers/AuthManager.js";
import Router from "../../viem/functions/router.js";
import ERC20 from "../../viem/functions/ERC20.js";
import Pool from "../../viem/functions/pool.js";
import * as viem from "viem";
import { networks, privateKeyToAccount } from "../../viem/utils/utils.js";
import NetworkManager from "../managers/NetworkManager.js";

async function getPools() {
  try {
    return await ViemPool.getPools();
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function getPoolByName(pool_name) {
  try {
    const pools = await getPools();
    if (!pools) return null;
    
    // Check if pool_name is an address
    const pool = pools.find(pool => 
      pool.name === pool_name || 
      pool.address.toLowerCase() === pool_name.toLowerCase()
    );
    
    if (!pool) {
      console.error(`Pool not found: ${pool_name}`);
      return null;
    }
    
    return pool;
  } catch (err) {
    console.error("Error getting pool by name:", err);
    return null;
  }
}

async function getFactoryContract() {
  try {
    return await ViemPool.getContract();
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function updatePool(pool) {
  try {
    const pools = await getPools();
    return pools.find(({ address }) => address === pool.address);
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function addLiquidity(pool_name, token_address, token_amount) {
  try {
    const pool = await getPoolByName(pool_name);
    if (!pool) {
      throw new Error(`Pool not found: ${pool_name}`);
    }

    const private_key = await AuthManager.getPrivateKey();
    return await ViemPool.addLiquidity(
      pool.address,
      token_address,
      token_amount,
      private_key
    );
  } catch (err) {
    console.error("Add liquidity error:", err);
    return false;
  }
}

async function createWalletClient(private_key) {
  const account = privateKeyToAccount(private_key);
  const walletClient = await viem.createWalletClient({
    account,
    transport: networks()[NetworkManager.network.name].transport,
  });
  return { account, walletClient };
}

async function swap(pool_name, token_in_address, amount_in) {
  try {
    // Get pool
    const pool = await getPoolByName(pool_name);
    if (!pool) {
      throw new Error(`Pool not found: ${pool_name}`);
    }

    // Get router address
    const routerAddress = Router.address;

    // Create token contract
    const token = new ERC20(token_in_address);
    
    // Create wallet client and account
    const private_key = await AuthManager.getPrivateKey();
    const { account, walletClient } = await createWalletClient(private_key);
    
    // Get decimals and calculate amount
    const decimals = await token.read("decimals", [], { account, walletClient });
    const amount_in_bigint = BigInt(amount_in) * BigInt(10 ** decimals);

    console.log("Approving token transfer...");
    await token.approve(routerAddress, amount_in_bigint, { account, walletClient });

    // Execute swap
    console.log("Executing swap...");
    return await Router.swap(
      pool.address,
      token_in_address,
      amount_in,
      private_key
    );
  } catch (err) {
    console.error("Pool swap error:", err);
    return false;
  }
}

async function getTokenPrice(pool_address, token_address) {
  try {
    return await Router.getTokenPrice(pool_address, token_address);
  } catch (err) {
    console.error("Error getting token price:", err);
    return null;
  }
}

async function calculatePriceImpact(pool_address, tokenIn_address, amountIn) {
  try {
    const pool = await getPoolByName(pool_address);
    if (!pool) throw new Error("Pool not found");

    // Get current reserves
    const pairContract = new Pool(pool.address);
    await pairContract.getContract();
    const reserves = await pairContract.contract.read.getReserves();
    
    // Determine which token is being swapped
    const token0 = await pairContract.contract.read.token0();
    const token1 = await pairContract.contract.read.token1();
    const isToken0 = tokenIn_address.toLowerCase() === token0.toLowerCase();
    
    // Get token contracts for decimals
    const token0Contract = new ERC20(token0);
    const token1Contract = new ERC20(token1);
    await token0Contract.getContract();
    await token1Contract.getContract();

    const token0Decimals = await token0Contract.contract.read.decimals();
    const token1Decimals = await token1Contract.contract.read.decimals();
    
    // Convert reserves to proper decimals
    const reserve0 = Number(reserves[0]) / (10 ** token0Decimals);
    const reserve1 = Number(reserves[1]) / (10 ** token1Decimals);
    
    // Calculate amount out using x * y = k formula
    const amountInWithFee = Number(amountIn) * 0.997; // 0.3% fee
    
    if (isToken0) {
      const amountOut = (reserve1 * amountInWithFee) / (reserve0 + amountInWithFee);
      
      // Calculate prices
      const currentPrice = reserve1 / reserve0;
      const newReserve0 = reserve0 + Number(amountIn);
      const newReserve1 = reserve1 - amountOut;
      const newPrice = newReserve1 / newReserve0;
      
      // Calculate price impact
      const priceImpact = ((currentPrice - newPrice) / currentPrice) * 100;
      
      return {
        priceImpact,
        amountOut,
        currentPrice,
        newPrice
      };
    } else {
      const amountOut = (reserve0 * amountInWithFee) / (reserve1 + amountInWithFee);
      
      // Calculate prices (inverse for token1)
      const currentPrice = reserve0 / reserve1;
      const newReserve1 = reserve1 + Number(amountIn);
      const newReserve0 = reserve0 - amountOut;
      const newPrice = newReserve0 / newReserve1;
      
      // Calculate price impact
      const priceImpact = ((currentPrice - newPrice) / currentPrice) * 100;
      
      return {
        priceImpact,
        amountOut,
        currentPrice,
        newPrice
      };
    }
  } catch (error) {
    console.error("Calculate price impact error:", error);
    return null;
  }
}

export default {
  getPools,
  getPoolByName,
  getFactoryContract,
  updatePool,
  addLiquidity,
  swap,
  getTokenPrice,
  calculatePriceImpact
};
