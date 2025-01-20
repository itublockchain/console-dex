import Contract from "./Contract_Base.js";
import ERC20 from "./ERC20.js";
import Pool from "./pool.js";
import Router from "./router.js";
import AuthManager from "../../src/managers/AuthManager.js";
import { debug_mode } from "../../src/config.js";

class Factory extends Contract {
  constructor() {
    super();

    this.contract_name = "factory";

    this.setAddress();
    this.getContract();
  }

  async getPoolContract(pair_address) {
    try {
      const pool = new Pool(pair_address);
      await pool.getContract();
      await pool.initializeFactory();
      return pool;
    } catch (error) {
      return null;
    }
  }

  async getPools() {
    try {
      this.setAddress();
      await this.getContract();

      const pair_length = Number(await this.contract.read.allPairsLength());

      const pairAddressPromises = Array.from({ length: pair_length }, (_, i) =>
        this.contract.read.allPairs([i])
      );
      const pairAddresses = await Promise.all(pairAddressPromises);

      let walletClient, account;
      if (AuthManager.isLoggedIn()) {
        const private_key = await AuthManager.getPrivateKey();
        const result = await Router.createWalletClient(private_key);
        walletClient = result.client;
        account = result.account;
      }

      const pairPromises = pairAddresses.map(async (pair_address) => {
        try {
          // Initialize pool contract
          const pool = await this.getPoolContract(pair_address);
          if (!pool) {
            return null;
          }

          // Get pool data
          const [reserves, token0Address, token1Address] = await Promise.all([
            pool.contract.read.getReserves(),
            pool.contract.read.token0(),
            pool.contract.read.token1(),
          ]);

          // Initialize token contracts
          const token0Contract = new ERC20(token0Address);
          const token1Contract = new ERC20(token1Address);

          // Get token properties with better error handling
          const [token0Props, token1Props] = await Promise.all([
            token0Contract
              .getProperties({ account, walletClient, test: true })
              .catch(() => ({
                name: "Unknown Token",
                symbol: "???",
                decimals: 18,
              })),
            token1Contract
              .getProperties({ account, walletClient, test: true })
              .catch(() => ({
                name: "Unknown Token",
                symbol: "???",
                decimals: 18,
              })),
          ]);

          // Calculate reserves with proper decimals
          const reserve0 = reserves[0]
            ? Number(reserves[0]) / 10 ** token0Props.decimals
            : 0;
          const reserve1 = reserves[1]
            ? Number(reserves[1]) / 10 ** token1Props.decimals
            : 0;

          // Calculate k (constant product)
          const k = reserve0 * reserve1;

          // Return pool data
          return {
            name: `${token0Props.symbol} / ${token1Props.symbol}`,
            k,
            address: pair_address,
            token0: {
              address: token0Address,
              ...token0Props,
              reserve: Number(reserves[0].toString()),
              formattedReserve: reserve0,
            },
            token1: {
              address: token1Address,
              ...token1Props,
              reserve: Number(reserves[1].toString()),
              formattedReserve: reserve1,
            },
          };
        } catch (error) {
          return null;
        }
      });

      const pairs = await Promise.all(pairPromises);
      return pairs.filter((pair) => pair !== null);
    } catch (error) {
      if (debug_mode()) console.error("Factory.js getPools: ", error.name);
      if (error.message.startsWith("HTTP request failed.")) throw error;
      return [];
    }
  }

  async addLiquidity(pool_address, token_address, token_amount, private_key) {
    try {
      if (!pool_address || !token_address || !token_amount || !private_key) {
        return false;
      }

      this.getContract();
      const result = await Router.addLiquidity(
        pool_address,
        token_address,
        token_amount,
        private_key
      );

      const transaction = await this.publicClient.getTransactionReceipt({
        hash: result,
      });

      if (transaction.status === "success") return result;
      else if (debug_mode()) console.log("Transaction failed");

      return false;
    } catch (error) {
      if (debug_mode())
        console.error("Factory.js, Error adding liquidity:", error);
      return false;
    }
  }

  async swap(pool_address, token_in_address, amount_in, private_key) {
    try {
      this.getContract();
      if (!pool_address || !token_in_address || !amount_in || !private_key) {
        return false;
      }

      const result = await Router.swap(
        pool_address,
        token_in_address,
        amount_in,
        private_key
      );

      return result;
    } catch (error) {
      return false;
    }
  }
}

const ViemPool = new Factory();
export { ViemPool };

export default Factory;
