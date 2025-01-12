import Contract from "./Contract_Base.js";
/*
        Example:
    {
        "tokenA": "0x3B20713Ac80ef6d28bA8F854BF077c4b591aF6a1",
        "tokenB": "0xECE93e9d4f898084C979D8A27893d0C7D97874BF",
        "factory": "0x9bE8AA384AD5e2a29F0684966846263B14cB08d6",
        "router": "0xde79C6100d7a9F0E8a407e5fA3DB3c2Bfa71F160",
        "pair": "0x040B7A24F2dD1a31a91895f07945fA33D55Fa067",
        "weth": "0xD4265a24Bb3Fad3589d08b353be291F8Fd02efC5"
    }
*/

class Factory extends Contract {
  constructor() {
    super();

    this.contract_name = "factory";
    this.setAddress();
    this.getContract();
  }
}

export default new Factory();
