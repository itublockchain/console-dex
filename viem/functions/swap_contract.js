import Contract from "./Contract_Base.js";

class Swap extends Contract {
  constructor(address) {
    super(address);
    this.contract_name = "swap";
    this.setAddress();
    this.getContract();
  }

  async swap() {}
}

export default Swap;
