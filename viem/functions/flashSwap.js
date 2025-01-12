import Contract from "./Contract_Base.js";

class FlashSwap extends Contract {
  constructor() {
    super();
    this.contract_name = "flashSwap";
    this.setAddress();
  }
}

export default FlashSwap;
