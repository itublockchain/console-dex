import { ViemPool } from "../../viem/functions/factory.js";
import AuthManager from "../managers/AuthManager.js";
import Router from "../../viem/functions/router.js";
import ERC20 from "../../viem/functions/ERC20.js";
import Pool from "../../viem/functions/pool.js";
import * as viem from "viem";
import { networks, privateKeyToAccount } from "../../viem/utils/utils.js";
import NetworkManager from "../managers/NetworkManager.js";
import { debug_mode } from "../config.js";
import ErrorHandler from "../managers/ErrorHandler.js";

async function getPools() {
  try {
    // Force contract refresh
    await ViemPool.setAddress();
    await ViemPool.getContract();

    // Get fresh pools list
    const pools = await ViemPool.getPools();

    if (!pools || pools.length === 0) {
      if (debug_mode()) console.log("No pools found");
      return [];
    }

    return pools;
  } catch (error) {
    if (debug_mode())
      console.error("pool_service.js, error getting pools:", error.name);
    if (error.message.startsWith("HTTP request failed.")) {
      error.name = "HTTPRequestError";
      ErrorHandler.setError(error);

      return false;
    }
    return [];
  }
}

async function getPoolByName(pool_name) {
  try {
    const pools = await getPools();
    if (!pools) return null;

    // Check if pool_name is an address
    const pool = pools.find(
      (pool) =>
        pool.name === pool_name ||
        pool.address.toLowerCase() === pool_name.toLowerCase()
    );

    if (!pool) {
      if (debug_mode()) console.error(`Pool not found: ${pool_name}`);
      return null;
    }

    return pool;
  } catch (err) {
    if (debug_mode()) console.error("Error getting pool by name:", err);
    return null;
  }
}

async function getFactoryContract() {
  try {
    return await ViemPool.getContract();
  } catch (err) {
    if (debug_mode()) console.error(err);
    return null;
  }
}

async function updatePool(pool) {
  try {
    const pools = await getPools();
    return pools.find(({ address }) => address === pool.address);
  } catch (err) {
    if (debug_mode()) console.error(err);
    return null;
  }
}

async function addLiquidity(pool_name, token_address, token_amount) {
  try {
    const pool = await getPoolByName(pool_name);
    if (!pool) {
      if (debug_mode()) console.error(`Pool not found: ${pool_name}`);
      return false;
    }

    const private_key = await AuthManager.getPrivateKey();
    if (!private_key) {
      if (debug_mode()) console.error("No private key available");
      return false;
    }

    const result = await ViemPool.addLiquidity(
      pool.address,
      token_address,
      token_amount,
      private_key
    );

    return result !== false;
  } catch (err) {
    if (debug_mode()) console.error("Add liquidity error:", err);
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

    // Create wallet client and account
    const private_key = await AuthManager.getPrivateKey();
    const { account, walletClient } = await createWalletClient(private_key);

    // Create token contract and get properties
    const token = new ERC20(token_in_address);
    await token.getContract({ account, walletClient });
    const tokenProps = await token.getProperties({ account, walletClient });

    if (!tokenProps) {
      throw new Error("Failed to get token properties");
    }

    // Calculate amount with decimals
    const amount_in_bigint =
      BigInt(amount_in) * BigInt(10 ** tokenProps.decimals);

    // Check token balance
    const hasBalance = await token.hasEnoughBalance(
      account.address,
      amount_in_bigint,
      { account, walletClient }
    );
    if (!hasBalance) {
      throw new Error(`Insufficient ${tokenProps.symbol} balance`);
    }

    // Check current allowance
    const currentAllowance = await token.allowance(
      account.address,
      routerAddress,
      { account, walletClient }
    );
    if (debug_mode())
      console.log("Current allowance:", currentAllowance.toString());

    // If allowance is insufficient, approve
    if (currentAllowance < amount_in_bigint) {
      console.log(
        `Approving ${amount_in} ${tokenProps.symbol} for transfer...`
      );

      // First reset allowance if needed
      if (currentAllowance > 0n) {
        const resetTx = await token.contract.write.approve(
          [routerAddress, 0n],
          { account, walletClient }
        );
        await token.waitForTransaction(resetTx);
        if (debug_mode()) console.log("Reset allowance to 0");
        else console.log("Wait for a sec...");
      }

      // Now set new allowance
      const approveTx = await token.contract.write.approve(
        [routerAddress, amount_in_bigint],
        { account, walletClient }
      );

      const receipt = await token.waitForTransaction(approveTx);
      if (!receipt) {
        throw new Error("Approval transaction failed");
      }
      console.log("Token approval confirmed");
    } else if (debug_mode()) {
      console.log("Sufficient allowance exists, skipping approval");
    }

    // Execute swap
    console.log("Executing swap transaction...");
    const txHash = await Router.swap(
      pool.address,
      token_in_address,
      amount_in_bigint,
      private_key
    );

    // Check if we got a transaction hash back
    if (typeof txHash === "string" && txHash.startsWith("0x")) {
      console.log(`Swap transaction hash: ${txHash}`);
      return true;
    }

    // If we got false or null, transaction failed
    if (!txHash) {
      throw new Error("Swap transaction failed - no transaction hash returned");
    }

    // If we got something else unexpected
    throw new Error(`Unexpected swap result: ${txHash}`);
  } catch (err) {
    if (debug_mode()) console.error("Pool swap error:", err);
    throw err;
  }
}

async function getTokenPrice(pool_address, token_address) {
  try {
    return await Router.getTokenPrice(pool_address, token_address);
  } catch (err) {
    if (debug_mode()) console.error("Error getting token price:", err);
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
    const reserve0 = Number(reserves[0]) / 10 ** token0Decimals;
    const reserve1 = Number(reserves[1]) / 10 ** token1Decimals;

    // Calculate amount out using x * y = k formula
    const amountInWithFee = Number(amountIn) * 0.997; // 0.3% fee

    if (isToken0) {
      const amountOut =
        (reserve1 * amountInWithFee) / (reserve0 + amountInWithFee);

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
        newPrice,
      };
    } else {
      const amountOut =
        (reserve0 * amountInWithFee) / (reserve1 + amountInWithFee);

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
        newPrice,
      };
    }
  } catch (error) {
    if (debug_mode()) console.error("Calculate price impact error:", error);
    return null;
  }
}

async function getPoolReserves(pool_address) {
  try {
    const pool = new Pool(pool_address);
    const reserves = await pool.getReserves();
    return reserves;
  } catch (err) {
    if (debug_mode()) console.error("Error getting pool reserves:", err);
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
  calculatePriceImpact,
  getPoolReserves,
};
