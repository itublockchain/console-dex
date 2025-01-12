import pre_defined_networks from "../../storage/pre_defined_networks.json" assert { type: "json" };

class NetworkManager {
  constructor() {
    this.network = pre_defined_networks.find((ntw) => ntw.name === "sepolia");
    this.networks = pre_defined_networks;
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
