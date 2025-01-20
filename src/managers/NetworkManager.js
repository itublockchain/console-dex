import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { test_mode } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pre_defined_networks = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../../storage/pre_defined_networks.json")
  )
);

class NetworkManager {
  constructor() {
    const start_name = test_mode() ? "testnet" : "sepolia";
    this.network = pre_defined_networks.find((ntw) => ntw.name === start_name);
    this.networks = pre_defined_networks;
  }

  getCurrentNetwork() {
    return this.network ? this.network.name : "Not Connected";
  }

  changeRPCUrl(network_name, url) {
    this.networks.find((ntw) => ntw.name === network_name).url = url;
  }

  switchNetwork(network) {
    const index = this.networks.findIndex((ntw) => ntw.name === network);

    if (index === -1) return false;

    this.network = this.networks[index];
    return true;
  }

  changeNetworkName(network, name) {
    const index = this.networks.findIndex((ntw) => ntw.name === network);

    if (index === -1) return false;

    this.networks[index].name = name;
    this.network = this.networks[index];

    return true;
  }
}

export default new NetworkManager();
