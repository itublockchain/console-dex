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

  async swap(pool_address, token_in_address, amount_in, private_key) {
    try {
      // Validate parameters
      if (!pool_address || !token_in_address || !amount_in || !private_key) {
        throw new Error("Invalid parameters for swap.");
      }

      // Initialize router contract
      this.setAddress();

      const account = privateKeyToAccount(private_key);
      const walletClient = await viem.createWalletClient({
        account,
        transport: networks()[NetworkManager.network.name].transport,
      });

      this.getContract({ walletClient });

      // Get the pool contract to find token addresses
      const pair = new Pool(pool_address);
      const pair_contract = await pair.getContract({ walletClient });

      // Get token addresses
      const token0 = await pair_contract.read.token0();
      const token1 = await pair_contract.read.token1();

      // Determine token_out_address
      const token_out_address = token_in_address === token0 ? token1 : token0;

      // Initialize token contract and approve
      const token_in = new ERC20(token_in_address);
      token_in.getContract({ walletClient });

      const amount_in_bigint = BigInt(amount_in);

      // Approve the router contract to spend the tokens
      await token_in.contract.write.approve([this.address, amount_in_bigint]);

      // Execute the swap
      const tx = await this.contract.write.swapExactTokensForTokens([
        amount_in_bigint,
        (amount_in_bigint * 95n) / 100n, // %5 Slippage
        [token_in_address, token_out_address],
        account.address,
        Math.floor(Date.now() / 1000) + 3600,
      ]);

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      if (receipt.status !== "success") {
        throw new Error("Transaction failed");
      }

      return receipt;
    } catch (error) {
      console.error("Swap error:", error);
      throw error;
    }
  }

  // Add Liquidity
  async addLiquidity(pool_address, token_address, token_amount, private_key) {
    try {
      this.setAddress();

      const account = privateKeyToAccount(private_key);
      const walletClient = viem.createWalletClient({
        account: account,
        transport: networks()[NetworkManager.network.name].transport,
      });

      this.getContract({ walletClient });

      const pools = await ViemPool.getPools();
      const pool = pools.find(({ address }) => address === pool_address);
      if (!pool) throw new Error("Pool not found");

      const main_token =
        token_address == pool.token0.address ? pool.token0 : pool.token1;
      const other_token =
        token_address == pool.token1.address ? pool.token0 : pool.token1;

      // Minimum miktar kontrolü ekle
      if (Number(token_amount) <= 0) {
        throw new Error("Token amount must be greater than 0");
      }

      // Parse amount according to token decimals
      const parsedAmount = viem.parseUnits(
        token_amount.toString(),
        main_token.decimals
      );

      // Pool contract'ını al ve rezervleri getir
      const pool_contract = new Contract(pool_address);
      pool_contract.contract_name = "pair";
      pool_contract.getContract({ walletClient });

      const [reserve0, reserve1] =
        await pool_contract.contract.read.getReserves();

      // Hangi token'ın reserve'ünü kullanacağımızı belirle
      const mainTokenReserve =
        token_address === pool.token0.address ? reserve0 : reserve1;
      const otherTokenReserve =
        token_address === pool.token0.address ? reserve1 : reserve0;

      // Diğer token için gereken miktarı hesapla
      const otherTokenAmount =
        mainTokenReserve === 0n
          ? parsedAmount // İlk likidite ekleme durumu
          : (parsedAmount * otherTokenReserve) / mainTokenReserve;

      // Minimum miktarları hesapla (% 95)
      const mainMinAmount = (parsedAmount * 95n) / 100n;
      const otherMinAmount = (otherTokenAmount * 95n) / 100n;

      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // Ana token için approve
      const main_token_contract = new ERC20(main_token.address);
      main_token_contract.getContract({ walletClient });
      await main_token_contract.approve(this.address, parsedAmount);

      // Diğer token için approve
      const other_token_contract = new ERC20(other_token.address);
      other_token_contract.getContract({ walletClient });
      await other_token_contract.approve(this.address, otherTokenAmount);

      // Bakiye kontrolü
      const mainBalance = await main_token_contract.balanceOf(account.address);
      if (mainBalance < parsedAmount) {
        throw new Error(`Insufficient ${main_token.symbol} balance`);
      }
      const otherBalance = await other_token_contract.balanceOf(
        account.address
      );
      if (otherBalance < otherTokenAmount) {
        throw new Error(`Insufficient ${other_token.symbol} balance`);
      }

      // Likidite ekleme işlemi
      const tx = await this.contract.write.addLiquidity([
        main_token.address,
        other_token.address,
        parsedAmount, // amountADesired
        otherTokenAmount, // amountBDesired
        mainMinAmount, // amountAMin
        otherMinAmount, // amountBMin
        account.address,
        BigInt(deadline),
      ]);

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      if (receipt.status !== "success") {
        throw new Error("Transaction failed");
      }

      // Bakiye kontrolü
      const mainBalanceAfter = await main_token_contract.balanceOf(
        account.address
      );
      if (mainBalanceAfter < parsedAmount) {
        throw new Error(`Insufficient ${main_token.symbol} balance`);
      }

      return true;
    } catch (error) {
      console.error("AddLiquidity error:", error);
      throw error;
    }
  }
}

export default new Router();
