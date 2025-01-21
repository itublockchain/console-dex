import { ABI, networks } from "../utils/utils.js";
import { createPublicClient } from "viem";
import NetworkManager from "../../src/managers/NetworkManager.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import * as viem from "viem";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addresses = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../storage/addresses.json"))
);

class Contract {
  constructor(address) {
    this.contract_name = "";
    this.address = address;
    this.contract = null;
    this.publicClient = this.usePublicClient();
  }

  getContract({ walletClient, account, test } = {}) {
    if (this.address == null) return "No Contract";

    this.publicClient = this.usePublicClient();

    const client = walletClient || this.publicClient;

    try {
      this.contract = viem.getContract({
        address: this.address,
        abi: ABI[this.contract_name],
        client,
        account,
      });

      return this.contract;
    } catch (error) {
      return null;
    }
  }

  usePublicClient() {
    return createPublicClient({
      transport: networks()[NetworkManager.network.name].transport,
    });
  }

  setAddress() {
    try {
      this.address = addresses[NetworkManager.network.name][this.contract_name];
      this.publicClient = this.usePublicClient();
      return true;
    } catch (e) {
      return false;
    }
  }

  async waitForTransaction(tx) {
    try {
      return await this.publicClient.waitForTransactionReceipt({ hash: tx });
    } catch (error) {
      return null;
    }
  }

  async write(functionName, args = [], { account, walletClient } = {}) {
    try {
      if (!account) {
        return null;
      }

      // Initialize contract with wallet client and account if provided
      this.getContract({ walletClient, account });

      // Execute write operation
      const tx = await this.contract.write[functionName](args, { account });
      return tx;
    } catch (error) {
      return null;
    }
  }

  async read(functionName, args = [], { account, walletClient, test } = {}) {
    try {
      // Initialize contract with optional wallet client and account
      this.getContract({ walletClient, account });

      // Execute read operation with args as array
      return await this.contract.read[functionName](args);
    } catch (error) {
      return null;
    }
  }
}

export default Contract;
