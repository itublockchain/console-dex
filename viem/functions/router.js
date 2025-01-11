import * as viem from "viem";
import { networks, privateKeyToAccount } from "../utils/utils.js";
import Pool from "./pool.js";
import Contract from "./Contract_Base.js";
import ERC20 from "./ERC20.js";

class Router extends Contract {
  constructor() {
    super();
    this.contract_name = "router";
    this.setAddress();
  }

  async swap(pool_address, token_in_address, amount_in, private_key) {
    try {
      const account = privateKeyToAccount(private_key);
      const walletClient = await viem.createWalletClient({
        account,
        transport: networks[NetworkManager.network.name].transport,
      });

      const token_in = new ERC20(token_in_address);
      await token_in.getContract({ walletClient });

      // Approve the pool contract to spend the specified amount of token_in
      await token_in.contract.write.approve([pool_address, amount_in]);

      // Check the allowance
      const allowance = await token_in.contract.read.allowance([
        account.address,
        pool_address,
      ]);
      console.log("Token Allowance:", allowance.toString());

      const pair = new Contract();
      pair.contract_name = "pair";
      pair.address = pool_address;
      const pair_contract = await pair.getContract({ walletClient });

      const reserves = await pair_contract.read.getReserves();
      const token0 = await pair_contract.read.token0();
      const isToken0 = token_in_address === token0;

      const reserve_in = isToken0 ? reserves[0] : reserves[1];
      const reserve_out = isToken0 ? reserves[1] : reserves[0];

      console.log("Amount In:", amount_in);
      console.log("Reserve In:", reserve_in.toString());
      console.log("Reserve Out:", reserve_out.toString());

      const amount_in_bigint = BigInt(amount_in);

      if (amount_in_bigint <= 0n) {
        throw new Error("Invalid input amount: must be greater than zero.");
      }

      const amount_out =
        (amount_in_bigint * reserve_out) / (reserve_in + amount_in_bigint);
      console.log("Calculated Amount Out:", amount_out.toString());

      if (amount_out <= 0n) {
        throw new Error("Insufficient output amount: not enough liquidity.");
      }

      const tx = await pair_contract.write.swap([
        isToken0 ? amount_in_bigint : 0n, // amount0Out
        isToken0 ? 0n : amount_in_bigint, // amount1Out
        account.address, // to
        "0x", // data (empty for regular swaps)
      ]);

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      if (receipt.status !== "success") {
        throw new Error("Transaction failed");
      }

      console.log("Swap successful:", {
        amountIn: amount_in,
        amountOut: amount_out.toString(),
      });

      return receipt;
    } catch (error) {
      console.error("Swap error:", error);
      throw error;
    }
  }

  async addLiquidity(pool_address, token_address, token_amount, private_key) {
    try {
      const account = privateKeyToAccount(private_key);
      const walletClient = viem.createWalletClient({
        account: account,
        transport: networks[NetworkManager.network.name].transport,
      });

      this.getContract({ walletClient });

      const pools = await Pool.getPools();
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

      console.log(
        "Transaction successful.",
        `${main_token.symbol}:`,
        mainBalanceAfter
      );

      return true;
    } catch (error) {
      console.error("AddLiquidity error:", error);
      throw error;
    }
  }
}

export default new Router();
