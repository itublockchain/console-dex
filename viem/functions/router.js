import * as viem from "viem";
import { networks, privateKeyToAccount } from "../utils/utils.js";
import { ViemPool } from "./factory.js";
import Pool from "./pool.js";
import Contract from "./Contract_Base.js";
import ERC20 from "./ERC20.js";

import NetworkManager from "../../src/managers/NetworkManager.js";
import { debug_mode } from "../../src/config.js";

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
      account,
    };
  }

  async swap(pool_address, token_in_address, amount_in, private_key) {
    try {
      // Validate parameters
      if (!pool_address || !token_in_address || !amount_in || !private_key) {
        return false;
      }

      // Initialize router contract
      this.setAddress();

      // Create wallet client and account
      const { client: walletClient, account } = await this.createWalletClient(
        private_key
      );

      await this.getContract({ walletClient, account });

      // Get the pool contract to find token addresses
      const pool = new Pool(pool_address);
      await pool.getContract({ walletClient, account });

      // Get token addresses
      const token0 = await pool.contract.read.token0();
      const token1 = await pool.contract.read.token1();

      // Get token contracts to get decimals
      const token0Contract = new ERC20(token0);
      const token1Contract = new ERC20(token1);
      await token0Contract.getContract({ walletClient, account });
      await token1Contract.getContract({ walletClient, account });

      const [token0Props, token1Props] = await Promise.all([
        token0Contract.getProperties({ account, walletClient }),
        token1Contract.getProperties({ account, walletClient }),
      ]);

      // Determine token out address
      const token_out_address = token_in_address === token0 ? token1 : token0;

      // Check if amount_in is already in BigInt format
      let amount_in_bigint;
      if (typeof amount_in === "bigint") {
        amount_in_bigint = amount_in;
      } else {
        const decimals =
          token_in_address === token0
            ? token0Props.decimals
            : token1Props.decimals;
        amount_in_bigint = BigInt(Math.floor(amount_in * 10 ** decimals));
      }

      // Check native token balance for gas
      const balance = await this.publicClient.getBalance({
        address: account.address,
      });

      // Increase gas limit for larger swaps
      const gasEstimate =
        await this.contract.estimateGas.swapExactTokensForTokens(
          [
            amount_in_bigint,
            0n,
            [token_in_address, token_out_address],
            account.address,
            BigInt(Math.floor(Date.now() / 1000) + 3600),
          ],
          { account }
        );

      const minGas = gasEstimate * 2n; // Double the estimated gas to be safe
      const gasPrice = await this.publicClient.getGasPrice();
      const requiredBalance = minGas * gasPrice;

      if (balance < requiredBalance) {
        if (debug_mode) console.error("Insufficient ETH for gas");
        return false;
      }

      // Check token balance
      const tokenInContract = new ERC20(token_in_address);
      await tokenInContract.getContract({ walletClient, account });

      const hasEnoughBalance = await tokenInContract.hasEnoughBalance(
        account.address,
        amount_in_bigint,
        { account, walletClient }
      );

      if (!hasEnoughBalance) {
        if (debug_mode()) console.error("Insufficient token balance");
        return false;
      }

      // Approve token transfer
      const approveTx = await tokenInContract.approve(
        this.address,
        amount_in_bigint,
        {
          account,
          walletClient,
          gas: minGas, // Use same gas limit for approve
        }
      );

      if (!approveTx) {
        if (debug_mode()) console.error("Approval failed");
        return false;
      }

      // Calculate reserves and amounts
      const reserves = await pool.contract.read.getReserves();
      const [reserve0, reserve1] = reserves;

      const reserveIn = token_in_address === token0 ? reserve0 : reserve1;
      const reserveOut = token_in_address === token0 ? reserve1 : reserve0;

      // Calculate minimum amount out with 1% slippage
      const amountWithFee = amount_in_bigint * 997n; // 0.3% fee
      const numerator = amountWithFee * reserveOut;
      const denominator = reserveIn * 1000n + amountWithFee;
      const expectedOut = numerator / denominator;
      const minAmountOut = (expectedOut * 99n) / 100n; // 1% slippage

      // Execute swap transaction
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

      // First try with exact parameters
      try {
        const tx = await this.contract.write.swapExactTokensForTokens(
          [
            amount_in_bigint,
            minAmountOut,
            [token_in_address, token_out_address],
            account.address,
            deadline,
          ],
          {
            account,
            gas: minGas,
          }
        );

        const receipt = await this.waitForTransaction(tx);
        if (!receipt) {
          throw new Error("Transaction failed");
        }

        return receipt.transactionHash;
      } catch (swapError) {
        if (debug_mode())
          console.error("First swap attempt failed:", swapError);

        // If first attempt fails, try with zero minAmountOut
        console.log("Retrying with zero minAmountOut...");
        const tx2 = await this.contract.write.swapExactTokensForTokens(
          [
            amount_in_bigint,
            0n,
            [token_in_address, token_out_address],
            account.address,
            deadline,
          ],
          {
            account,
            gas: minGas,
          }
        );

        const receipt2 = await this.waitForTransaction(tx2);
        if (!receipt2) {
          throw new Error("Second swap attempt failed");
        }

        return receipt2.transactionHash;
      }
    } catch (error) {
      if (debug_mode()) console.error("Swap error:", error);
      return false;
    }
  }

  async getTokenPrice(
    pool_address,
    token_address,
    { account, walletClient } = {}
  ) {
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

      const token0Decimals = await token0Contract.read("decimals", [], {
        account,
        walletClient,
      });
      const token1Decimals = await token1Contract.read("decimals", [], {
        account,
        walletClient,
      });

      // Calculate price based on reserves
      const reserve0 = Number(reserves[0]) / 10 ** token0Decimals;
      const reserve1 = Number(reserves[1]) / 10 ** token1Decimals;

      // Get token symbols
      const token0Symbol = await token0Contract.read("symbol", [], {
        account,
        walletClient,
      });
      const token1Symbol = await token1Contract.read("symbol", [], {
        account,
        walletClient,
      });

      // Return price with token info
      if (token_address === token0) {
        return {
          price: reserve1 / reserve0,
          token: token0Symbol,
          baseToken: token1Symbol,
        };
      } else {
        return {
          price: reserve0 / reserve1,
          token: token1Symbol,
          baseToken: token0Symbol,
        };
      }
    } catch (error) {
      if (debug_mode()) console.error("Error getting token price:", error);
      return null;
    }
  }

  async addLiquidity(pool_address, token_address, token_amount, private_key) {
    try {
      // Validate parameters
      if (!pool_address || !token_address || !token_amount || !private_key) {
        if (debug_mode()) console.error("Missing parameters for addLiquidity");
        return false;
      }

      // Initialize router contract
      this.setAddress();

      // Create wallet client and account
      const { client: walletClient, account } = await this.createWalletClient(
        private_key
      );

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
      await tokenContract.getContract({ walletClient });
      await otherTokenContract.getContract({ walletClient });

      // Get decimals
      const tokenDecimals = await tokenContract.contract.read.decimals();
      const otherTokenDecimals =
        await otherTokenContract.contract.read.decimals();

      // Parse token amount to float if it's a string
      const tokenAmountFloat =
        typeof token_amount === "string"
          ? parseFloat(token_amount)
          : token_amount;

      // Convert input amount to BigInt with proper decimals
      const amountIn = BigInt(
        Math.floor(tokenAmountFloat * 10 ** Number(tokenDecimals))
      );
      if (debug_mode())
        console.log(
          "Amount In:",
          tokenAmountFloat,
          "Decimals:",
          tokenDecimals,
          "BigInt:",
          amountIn.toString()
        );

      // Get current reserves
      const reserves = await pair_contract.read.getReserves();
      const reserve0 = reserves[0];
      const reserve1 = reserves[1];
      if (debug_mode())
        console.log("Reserves:", reserve0.toString(), reserve1.toString());

      // Calculate other token amount based on reserves
      let otherTokenAmount;

      // Check if this is the first liquidity provision
      if (reserve0 === 0n && reserve1 === 0n) {
        // For first liquidity, we'll use the same nominal amount
        const otherTokenAmountFloat = tokenAmountFloat; // Use same amount for initial liquidity
        otherTokenAmount = BigInt(
          Math.floor(otherTokenAmountFloat * 10 ** Number(otherTokenDecimals))
        );
        console.log(
          "First liquidity - Other token amount:",
          otherTokenAmount.toString()
        );
      } else {
        // For subsequent liquidity adds, calculate based on current ratio
        const normalizedReserve0 =
          Number(reserve0) / 10 ** Number(tokenDecimals);
        const normalizedReserve1 =
          Number(reserve1) / 10 ** Number(otherTokenDecimals);
        if (debug_mode())
          console.log(
            "Normalized reserves:",
            normalizedReserve0,
            normalizedReserve1
          );

        const otherTokenOptimal =
          tokenAmountFloat * (normalizedReserve1 / normalizedReserve0);
        if (debug_mode())
          console.log("Optimal other token amount:", otherTokenOptimal);

        otherTokenAmount = BigInt(
          Math.floor(otherTokenOptimal * 10 ** Number(otherTokenDecimals))
        );
        if (debug_mode())
          console.log(
            "Other token amount BigInt:",
            otherTokenAmount.toString()
          );
      }

      // Ensure amounts are not zero
      if (amountIn === 0n || otherTokenAmount === 0n) {
        if (debug_mode()) console.error("Zero amounts calculated");
        return false;
      }

      // Check if user has enough balance for both tokens
      const hasEnoughToken0 = await tokenContract.hasEnoughBalance(
        account.address,
        amountIn,
        { account, walletClient }
      );

      const hasEnoughToken1 = await otherTokenContract.hasEnoughBalance(
        account.address,
        otherTokenAmount,
        { account, walletClient }
      );

      if (!hasEnoughToken0 || !hasEnoughToken1) {
        if (debug_mode()) console.error("Insufficient balance");
        return false;
      }

      // Check native token balance for gas
      const balance = await this.publicClient.getBalance({
        address: account.address,
      });

      // Estimate minimum required gas (rough estimate)
      const minGas = 300000n; // Increased gas limit for safety
      const gasPrice = await this.publicClient.getGasPrice();
      const requiredBalance = minGas * gasPrice;

      if (balance < requiredBalance) {
        if (debug_mode()) console.error("Insufficient ETH for gas");
        return false;
      }

      // Approve both tokens
      console.log("Approving tokens...");
      const approvalTx1 = await tokenContract.approve(this.address, amountIn, {
        account,
        walletClient,
      });

      const approvalTx2 = await otherTokenContract.approve(
        this.address,
        otherTokenAmount,
        {
          account,
          walletClient,
        }
      );

      // Return if either approval fails
      if (!approvalTx1 || !approvalTx2) {
        if (debug_mode()) console.error("Token approval failed");
        return false;
      }

      console.log("Tokens approved, adding liquidity...");

      // Execute addLiquidity transaction
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

      // For initial liquidity, use very small slippage to ensure it goes through
      const slippageNumerator =
        reserve0 === 0n && reserve1 === 0n ? 999n : 995n;
      const minAmountIn = (amountIn * slippageNumerator) / 1000n;
      const minOtherAmount = (otherTokenAmount * slippageNumerator) / 1000n;

      // Prepare arguments based on whether it's token0 or token1 being added first
      const args = [
        token0,
        token1,
        isToken0 ? amountIn : otherTokenAmount,
        isToken0 ? otherTokenAmount : amountIn,
        isToken0 ? minAmountIn : minOtherAmount,
        isToken0 ? minOtherAmount : minAmountIn,
        account.address,
        deadline,
      ];

      if (debug_mode())
        console.log("Adding liquidity with args:", {
          token0,
          token1,
          amount0: args[2].toString(),
          amount1: args[3].toString(),
          min0: args[4].toString(),
          min1: args[5].toString(),
          to: args[6],
          deadline: args[7].toString(),
        });

      const tx = await this.contract.write.addLiquidity(args, {
        account,
        gas: minGas,
      });

      console.log("Transaction sent:", tx);
      const receipt = await this.waitForTransaction(tx);

      // Format receipt for better logging
      if (receipt) {
        console.log("Transaction successful!");
        if (debug_mode)
          console.log("Gas used:", receipt.cumulativeGasUsed.toString());
        return receipt.transactionHash;
      } else {
        if (debug_mode()) console.error("Transaction failed - no receipt");
        return false;
      }
    } catch (error) {
      if (debug_mode()) console.error("Add liquidity error:", error);
      return false;
    }
  }

  async createPair(tokenA, tokenB, private_key) {
    try {
      // Validate parameters
      if (!tokenA || !tokenB || !private_key) {
        throw new Error("Invalid parameters for createPair.");
      }

      if (tokenA.toLowerCase() === tokenB.toLowerCase()) {
        throw new Error("Identical addresses.");
      }

      // Initialize router contract
      this.setAddress();

      // Create wallet client and account
      const { client: walletClient, account } = await this.createWalletClient(
        private_key
      );
      this.getContract({ walletClient });

      // Get factory contract and initialize it with the wallet client
      const factory = await ViemPool.getContract({ walletClient, account });

      // Create pair
      if(debug_mode())console.log("Router: Creating pair...");
      const tx = await factory.write.createPair([tokenA, tokenB], { account });

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      if (receipt.status !== "success") {
        throw new Error("Create pair transaction failed");
      }

      // Get the pair address
      const pairAddress = await factory.read.getPair([tokenA, tokenB]);

      return {
        receipt,
        pairAddress,
      };
    } catch (error) {
      if (debug_mode()) console.error("Create pair error:", error);
      throw error;
    }
  }
}

export default new Router();
