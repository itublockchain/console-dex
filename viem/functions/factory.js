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

      const pair_length = Number(await this.contract.read.allPairsLength()); // BigInt'i number'a çevir
      
      // Önce tüm pair adreslerini paralel olarak al
      const pairAddressPromises = Array.from({ length: pair_length }, (_, i) => 
        this.contract.read.allPairs([i])
      );
      const pairAddresses = await Promise.all(pairAddressPromises);

      // Her pair için gerekli bilgileri paralel olarak al
      const pairPromises = pairAddresses.map(async (pair_address) => {
        try {
          const pair = await this.getPoolContract(pair_address);
          const [
            reserves,
            token0Address,
            token1Address
          ] = await Promise.all([
            pair.read.getReserves(),
            pair.read.token0(),
            pair.read.token1()
          ]);

          const [token0, token1] = await Promise.all([
            new ERC20(token0Address).getProperties(),
            new ERC20(token1Address).getProperties()
          ]);

          // BigInt'leri güvenli bir şekilde number'a çevir
          const reserve0 = reserves[0] ? Number(reserves[0].toString()) : 0;
          const reserve1 = reserves[1] ? Number(reserves[1].toString()) : 0;

          return {
            name: `${token0.symbol} / ${token1.symbol}`,
            k: reserve0 * reserve1,
            address: pair_address,
            token0: {
              address: token0Address,
              ...token0,
              reserve: reserve0
            },
            token1: {
              address: token1Address,
              ...token1,
              reserve: reserve1
            }
          };
        } catch (err) {
          console.error("Error processing pool:", pair_address, err);
          return null;
        }
      });

      const pools = await Promise.all(pairPromises);
      // Hata alan pool'ları filtrele
      return pools.filter(pool => pool !== null);
      
    } catch (err) {
      console.error("Error in getPools:", err);
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
