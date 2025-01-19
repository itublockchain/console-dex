import Factory from "./factory.js";
import Contract from "./Contract_Base.js";

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
      
      // Convert BigInts to numbers for better display
      return [
        Number(reserve0) / (10 ** 18), // Assuming 18 decimals
        Number(reserve1) / (10 ** 18)  // Assuming 18 decimals
      ];
    } catch (err) {
      console.error("Error getting reserves:", err);
      return [0, 0];
    }
  }
}

export default Pool;
