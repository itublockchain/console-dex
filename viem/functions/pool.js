import Factory from "./factory.js";
import Contract from "./Contract_Base.js";

class Pool extends Contract {
  constructor(address) {
    super(address);
    this.contract_name = "pair";
    this.setAddress();
    this.factory = null;
  }

  async initializeFactory() {
    this.factory = Factory.getContract();
    return this.factory;
  }
}

export default Pool;
