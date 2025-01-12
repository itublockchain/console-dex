import * as viem from "viem";
import { ABI, networks } from "../utils/utils.js";
import NetworkManager from "../../src/managers/NetworkManager.js"; // NetworkManager'ı burada import edin

import addresses from "../addresses.json" assert { type: "json" };

class Contract {
  constructor(address) {
    this.contract_name = "";
    this.address = address;
    this.contract = null;

    this.publicClient = viem.createPublicClient({
      transport: networks[NetworkManager.network.name].transport,
    });
  }

  getContract({ walletClient } = { walletClient: this.publicClient }) {
    if (this.address == null) return "No Contract";
    this.contract = viem.getContract({
      address: `${this.address}`,
      abi: ABI[this.contract_name],
      client: walletClient,
    });

    return this.contract;
  }

  setAddress() {
    this.address = addresses[NetworkManager.network.name][this.contract_name];
  }

  async waitForTransaction(tx) {
    return await this.publicClient.waitForTransactionReceipt({ hash: tx });
  }
}

export default Contract;
