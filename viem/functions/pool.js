import Factory from "./factory.js";
import ERC20 from "./ERC20.js";
import Router from "./router.js";
import Contract from "./Contract_Base.js";

import AuthManager from "../../src/managers/auth_manager.js";

class Pool extends Contract {
  constructor() {
    super();
    this.contract_name = "pair";
    this.setAddress();
    this.factory = null;
  }

  async initializeFactory() {
    this.factory = await Factory.getContract();
    return this.factory;
  }

  async getPoolContract(pair_address) {
    const contract = new Contract(pair_address);
    contract.contract_name = "pair";
    return contract.getContract();
  }

  async getPools() {
    try {
      const factory = await Factory.getContract();
      const pair_length = await factory.read.allPairsLength();
      let pairs = [];

      for (let i = 0; i < pair_length; i++) {
        const pair_address = await factory.read.allPairs([i]);
        const pair = await this.getPoolContract(pair_address);
        const reserves = await pair.read.getReserves();

        const token_0 = new ERC20();
        const token_1 = new ERC20();

        token_0.address = await pair.read.token0();
        token_1.address = await pair.read.token1();

        const token_0_contract = await token_0.getContract();
        const token_1_contract = await token_1.getContract();

        const reserve_0 = reserves[0];
        const reserve_1 = reserves[1];

        const name_0 = await token_0_contract.read.name();
        const name_1 = await token_1_contract.read.name();

        const symbol_0 = await token_0_contract.read.symbol();
        const symbol_1 = await token_1_contract.read.symbol();

        const decimals_0 = await token_0_contract.read.decimals();
        const decimals_1 = await token_1_contract.read.decimals();

        pairs.push({
          name: `${symbol_0}/${symbol_1}`,
          k: reserve_0 * reserve_1,
          address: pair_address,
          token0: {
            address: token_0.address,
            name: name_0,
            symbol: symbol_0,
            decimals: decimals_0,
            balance: reserve_0,
          },
          token1: {
            address: token_1.address,
            name: name_1,
            symbol: symbol_1,
            decimals: decimals_1,
            balance: reserve_1,
          },
        });
      }

      return pairs;
    } catch (error) {
      return false;
    }
  }

  async swap(pool_address, token_in_address, amount_in, private_key) {
    try {
      return await Router.swap(
        pool_address,
        token_in_address,
        amount_in,
        private_key
      );
    } catch (error) {
      console.error("Pool swap error:", error);
      throw error;
    }
  }

  async addLiquidity(pool_address, token_address, token_amount, private_key) {
    try {
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
}

export default new Pool();
