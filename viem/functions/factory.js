import Contract from "./Contract_Base.js";
import ERC20 from "./ERC20.js";
import Pool from "./pool.js";
import Router from "./router.js";

class Factory extends Contract {
  constructor() {
    super();

    this.contract_name = "factory";

    this.setAddress();
    this.getContract();
  }

  async getPoolContract(pair_address) {
    const contract = new Pool(pair_address);
    this.getContract();

    await contract.initializeFactory();
    return contract.getContract();
  }

  async getPools() {
    try {
      this.setAddress();
      this.getContract();

      const pair_length = await this.contract.read.allPairsLength();
      let pairs = [];

      for (let i = 0; i < pair_length; i++) {
        const pair_address = await this.contract.read.allPairs([i]);
        const pair = await this.getPoolContract(pair_address);
        const reserves = await pair.read.getReserves();

        const token_0 = new ERC20(await pair.read.token0());
        const token_1 = new ERC20(await pair.read.token1());

        const token_0_properties = await token_0.getProperties();
        const token_1_properties = await token_1.getProperties();
        // { name, symbol, decimals, address }

        const reserve_0 = reserves[0];
        const reserve_1 = reserves[1];

        pairs.push({
          name: `${token_0_properties.symbol} / ${token_1_properties.symbol}`,
          k: reserve_0 * reserve_1,
          address: pair_address,
          token0: {
            address: token_0_properties.address,
            name: token_0_properties.name,
            symbol: token_0_properties.symbol,
            decimals: token_0_properties.decimals,
            balance: reserve_0,
          },
          token1: {
            address: token_1_properties.address,
            name: token_1_properties.name,
            symbol: token_1_properties.symbol,
            decimals: token_1_properties.decimals,
            balance: reserve_1,
          },
        });
      }

      return pairs;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async addLiquidity(pool_address, token_address, token_amount, private_key) {
    try {
      this.getContract();
      return await Router.addLiquidity(
        pool_address,
        token_address,
        token_amount,
        private_key
      );
    } catch (error) {
      console.error("Pool addLiquidity error:", error);
      throw error;
    }
  }

  async swap(pool_address, token_in_address, amount_in, private_key) {
    try {
      this.getContract();
      // Validate parameters
      if (!pool_address || !token_in_address || !amount_in || !private_key) {
        throw new Error("Invalid parameters for swap.");
      }

      console.log(
        `Swapping ${amount_in} of token at address ${token_in_address} in pool at ${pool_address}`
      );

      // Call the Router's swap method
      const result = await Router.swap(
        pool_address,
        token_in_address,
        amount_in,
        private_key
      );

      console.log(`Swap successful: ${result.transactionHash}`);
      return result;
    } catch (error) {
      console.error("Pool swap error:", error);
      throw error;
    }
  }
}

const ViemPool = new Factory();
export { ViemPool };

export default new Factory();
