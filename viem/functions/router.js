import * as viem from "viem";
import { networks, privateKeyToAccount } from "../utils/utils.js";
import { ViemPool } from "./factory.js";
import Pool from "./pool.js";
import Contract from "./Contract_Base.js";
import ERC20 from "./ERC20.js";

import NetworkManager from "../../src/managers/NetworkManager.js";

class Router extends Contract {
  constructor() {
    super();
    this.contract_name = "router";
    this.setAddress();
  }

  async createWalletClient(private_key) {
    const account = privateKeyToAccount(private_key);
    return {
      client: await viem.createWalletClient({
        account,
        transport: networks()[NetworkManager.network.name].transport,
      }),
      account
    };
  }

  async swap(pool_address, token_in_address, amount_in, private_key) {
    try {
      // Validate parameters
      if (!pool_address || !token_in_address || !amount_in || !private_key) {
        throw new Error("Invalid parameters for swap.");
      }

      // Initialize router contract
      this.setAddress();

      // Create wallet client and account
      const { client: walletClient, account } = await this.createWalletClient(private_key);

      this.getContract({ walletClient });

      // Get the pool contract to find token addresses
      const pair = new Pool(pool_address);
      const pair_contract = await pair.getContract({ walletClient });

      // Get token addresses
      const token0 = await pair_contract.read.token0();
      const token1 = await pair_contract.read.token1();

      // Get token contracts to get decimals
      const token0Contract = new ERC20(token0);
      const token1Contract = new ERC20(token1);
      await token0Contract.getContract();
      await token1Contract.getContract();

      const token0Decimals = await token0Contract.read("decimals", [], { account, walletClient });
      const token1Decimals = await token1Contract.read("decimals", [], { account, walletClient });

      // Get current reserves
      const reservesBefore = await pair_contract.read.getReserves();
      console.log("Reserves before swap:", {
        token0_reserve: (
          Number(reservesBefore[0]) /
          10 ** token0Decimals
        ).toFixed(6),
        token1_reserve: (
          Number(reservesBefore[1]) /
          10 ** token1Decimals
        ).toFixed(6),
        token0_address: token0,
        token1_address: token1,
      });

      // Convert amount to BigInt with proper decimals
      const decimals = token_in_address === token0 ? token0Decimals : token1Decimals;
      const amount_in_bigint = BigInt(amount_in) * BigInt(10 ** decimals);

      // Determine token out address
      const token_out_address = token_in_address === token0 ? token1 : token0;

      // Approve token transfer
      console.log("Approving token transfer...");
      const tokenInContract = new ERC20(token_in_address);
      await tokenInContract.getContract({ walletClient });
      
      console.log(`Approving ${amount_in_bigint} tokens for spender: ${this.address}`);
      const approveTx = await tokenInContract.approve(this.address, amount_in_bigint, { account, walletClient });
      console.log("Approval transaction hash:", approveTx);

      // Execute swap
      console.log("Executing swap transaction...");
      const tx = await this.contract.write.swapExactTokensForTokens(
        [
          amount_in_bigint,
          0n, // No minimum for testing (BE CAREFUL WITH THIS IN PRODUCTION!)
          [token_in_address, token_out_address],
          account.address,
          Math.floor(Date.now() / 1000) + 3600,
        ],
        { account }
      );

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      if (receipt.status !== "success") {
        throw new Error("Transaction failed");
      }

      // Check reserves after swap
      const reservesAfter = await pair_contract.read.getReserves();
      console.log("Reserves after swap:", {
        token0_reserve: (
          Number(reservesAfter[0]) /
          10 ** token0Decimals
        ).toFixed(6),
        token1_reserve: (
          Number(reservesAfter[1]) /
          10 ** token1Decimals
        ).toFixed(6),
        token0_address: token0,
        token1_address: token1,
      });

      // Log the amount being swapped
      console.log("Amount being swapped:", {
        token_in: token_in_address === token0 ? "token0" : "token1",
        amount: (
          Number(amount_in) /
          10 ** (token_in_address === token0 ? token0Decimals : token1Decimals)
        ).toFixed(6),
      });

      return receipt;
    } catch (error) {
      console.error("Swap error:", error);
      throw error;
    }
  }

  async getTokenPrice(pool_address, token_address, { account, walletClient } = {}) {
    try {
      // Get the pool contract
      const pair = new Pool(pool_address);
      const pair_contract = await pair.getContract({ walletClient });

      // Get token addresses from the pool
      const token0 = await pair_contract.read.token0();
      const token1 = await pair_contract.read.token1();

      // Get reserves
      const reserves = await pair_contract.read.getReserves();

      // Get token contracts
      const token0Contract = new ERC20(token0);
      const token1Contract = new ERC20(token1);
      await token0Contract.getContract();
      await token1Contract.getContract();

      const token0Decimals = await token0Contract.read("decimals", [], { account, walletClient });
      const token1Decimals = await token1Contract.read("decimals", [], { account, walletClient });

      // Calculate price based on reserves
      const reserve0 = Number(reserves[0]) / 10 ** token0Decimals;
      const reserve1 = Number(reserves[1]) / 10 ** token1Decimals;

      // Get token symbols
      const token0Symbol = await token0Contract.read("symbol", [], { account, walletClient });
      const token1Symbol = await token1Contract.read("symbol", [], { account, walletClient });

      // Return price with token info
      if (token_address === token0) {
        return {
          price: reserve1 / reserve0,
          token: token0Symbol,
          baseToken: token1Symbol
        };
      } else {
        return {
          price: reserve0 / reserve1,
          token: token1Symbol,
          baseToken: token0Symbol
        };
      }
    } catch (error) {
      console.error("Error getting token price:", error);
      return null;
    }
  }

  async addLiquidity(pool_address, token_address, token_amount, private_key) {
    try {
      // Validate parameters
      if (!pool_address || !token_address || !token_amount || !private_key) {
        throw new Error("Invalid parameters for addLiquidity.");
      }

      // Initialize router contract
      this.setAddress();

      // Create wallet client and account
      const { client: walletClient, account } = await this.createWalletClient(private_key);

      this.getContract({ walletClient });

      // Get the pool contract
      const pair = new Pool(pool_address);
      const pair_contract = await pair.getContract({ walletClient });

      // Get token addresses
      const token0 = await pair_contract.read.token0();
      const token1 = await pair_contract.read.token1();

      // Determine which token is being added
      const isToken0 = token_address === token0;
      const otherTokenAddress = isToken0 ? token1 : token0;

      // Get token contracts
      const tokenContract = new ERC20(token_address);
      const otherTokenContract = new ERC20(otherTokenAddress);
      
      // Get decimals
      const tokenDecimals = await tokenContract.read("decimals", [], { account, walletClient });
      const otherTokenDecimals = await otherTokenContract.read("decimals", [], { account, walletClient });

      // Convert input amount to BigInt with proper decimals
      const amountIn = BigInt(token_amount) * BigInt(10 ** tokenDecimals);

      // Get current reserves and convert to proper decimals for calculation
      const reserves = await pair_contract.read.getReserves();
      const reserve0 = Number(reserves[0]) / (10 ** (isToken0 ? tokenDecimals : otherTokenDecimals));
      const reserve1 = Number(reserves[1]) / (10 ** (isToken0 ? otherTokenDecimals : tokenDecimals));

      // Calculate optimal amount of other token in proper decimals
      const otherTokenOptimal = isToken0
        ? (Number(token_amount) * reserve1) / reserve0
        : (Number(token_amount) * reserve0) / reserve1;

      // Convert other token amount to BigInt with its decimals
      const otherTokenAmount = BigInt(Math.floor(otherTokenOptimal * (10 ** otherTokenDecimals)));

      console.log("Adding liquidity...");
      console.log("Token amounts:", {
        [isToken0 ? "token0" : "token1"]: token_amount,
        [isToken0 ? "token1" : "token0"]: (Number(otherTokenAmount) / (10 ** otherTokenDecimals)).toFixed(6),
      });

      // Approve both tokens
      console.log("Approving tokens...");
      await tokenContract.approve(this.address, amountIn, { account, walletClient });
      await otherTokenContract.approve(this.address, otherTokenAmount, { account, walletClient });

      // Execute addLiquidity transaction
      const tx = await this.contract.write.addLiquidity(
        [
          token0,
          token1,
          isToken0 ? amountIn : otherTokenAmount,
          isToken0 ? otherTokenAmount : amountIn,
          0n, // slippage tolerance
          0n, // slippage tolerance
          account.address,
          BigInt(Math.floor(Date.now() / 1000) + 3600), // deadline: 1 hour
        ],
        { account }
      );

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      if (receipt.status !== "success") {
        throw new Error("Add liquidity transaction failed");
      }

      return receipt;
    } catch (error) {
      console.error("Add liquidity error:", error);
      throw error;
    }
  }
}

export default new Router();
