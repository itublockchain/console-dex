import * as viem from "viem";
import { ABI, networks } from "../utils/utils.js";
import NetworkManager from "../../src/managers/NetworkManager.js"; // NetworkManager'ı burada import edin

import addresses from "../../storage/addresses.json" assert { type: "json" };

class Contract {
  constructor(address) {
    this.contract_name = "";
    this.address = address;
    this.contract = null;

    this.publicClient = this.usePublicClient();
  }

  getContract({ walletClient } = { walletClient: this.usePublicClient() }) {
    if (this.address == null) return "No Contract";

    this.publicClient = this.usePublicClient();

    this.contract = viem.getContract({
      address: `${this.address}`,
      abi: ABI[this.contract_name],
      client: walletClient,
    });

    return this.contract;
  }

  usePublicClient() {
    return viem.createPublicClient({
      transport: networks()[NetworkManager.network.name].transport,
    });
  }

  setAddress() {
    try {
      this.address = addresses[NetworkManager.network.name][this.contract_name];
      this.publicClient = this.usePublicClient();
      return true;
    } catch (e) {
      console.error("error!", e);
      return false;
    }
  }

  async waitForTransaction(tx) {
    return await this.publicClient.waitForTransactionReceipt({ hash: tx });
  }
}

export default Contract;
