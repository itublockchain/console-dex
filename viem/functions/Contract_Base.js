import * as viem from "viem";
import { ABI, networks } from "../utils/utils.js";
import AuthManager from "../../src/managers/auth_manager.js"; // AuthManager'ı burada import edin

import { addresses } from "../../path.js";

class Contract {
  constructor(address) {
    this.contract_name = "";
    this.address = address;
    this.contract = null;

    this.publicClient = viem.createPublicClient({
      transport: networks[AuthManager.network].transport,
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
    const _addresses = addresses();
    this.address = _addresses[this.contract_name];
  }

  async waitForTransaction(tx) {
    return await this.publicClient.waitForTransactionReceipt({ hash: tx });
  }
}

export default Contract;
