import Factory from "./factory.js";
import Contract from "./Contract_Base.js";
import ERC20 from "./ERC20.js"; // Assuming ERC20 is in the same directory

class Pool extends Contract {
  constructor(address) {
    super();
    this.contract_name = "pair";
    this.address = address; // Use the provided pair address
  }

  async initializeFactory() {
    this.factory = new Factory();
    await this.factory.getContract();
    return this.factory;
  }

  // Override setAddress to prevent overwriting the pair address
  setAddress() {
    // Do nothing - we want to keep the pair address provided in constructor
    return true;
  }

  async getReserves() {
    try {
      if (!this.contract) {
        await this.getContract();
      }

      // Call getReserves() on the pair contract
      const [reserve0, reserve1] = await this.contract.read.getReserves();

      // Get token addresses
      const token0Address = await this.contract.read.token0();
      const token1Address = await this.contract.read.token1();

      // Get token contracts to read decimals
      const token0Contract = new ERC20(token0Address);
      const token1Contract = new ERC20(token1Address);
      await token0Contract.getContract();
      await token1Contract.getContract();

      // Get decimals for each token
      const decimals0 = await token0Contract.contract.read.decimals();
      const decimals1 = await token1Contract.contract.read.decimals();

      // Convert BigInts to numbers using correct decimals
      return [
        Number(reserve0) / 10 ** decimals0,
        Number(reserve1) / 10 ** decimals1,
      ];
    } catch (err) {
      if (debug_mode()) console.error("Error getting reserves:", err);
      return [0, 0];
    }
  }
}

export default Pool;
