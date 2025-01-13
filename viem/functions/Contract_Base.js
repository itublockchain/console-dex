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

  getContract({ walletClient, account } = {}) {
    if (this.address == null) return "No Contract";

    this.publicClient = this.usePublicClient();

    const client = walletClient || this.publicClient;

    this.contract = viem.getContract({
      address: this.address,
      abi: ABI[this.contract_name],
      client,
      account,
    });

    return this.contract;
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
      console.error("error!", e);
      return false;
    }
  }

  async waitForTransaction(tx) {
    return await this.publicClient.waitForTransactionReceipt({ hash: tx });
  }

  async write(functionName, args = [], { account, walletClient } = {}) {
    try {
      if (!account) {
        throw new Error("Account is required for write operations");
      }

      // Initialize contract with wallet client and account if provided
      this.getContract({ walletClient, account });

      // Execute write operation
      const tx = await this.contract.write[functionName](args, { account });
      return tx;
    } catch (error) {
      console.error(`Error in write operation ${functionName}:`, error);
      throw error;
    }
  }

  async read(functionName, args = [], { account, walletClient } = {}) {
    try {
      // Initialize contract with optional wallet client and account
      this.getContract({ walletClient, account });

      // Execute read operation
      return await this.contract.read[functionName](args);
    } catch (error) {
      throw error;
    }
  }
}

export default Contract;
