import inquirer from "inquirer";
import NetworkManager from "../../managers/NetworkManager.js";

import chalk from "chalk";
import SwitchNetworkMenu from "./switch_network_menu.js";
import Header from "../Components/Header.js";
import ReturnMenu from "../Components/return_menu.js";

async function NetworkMenu(network_name) {
  const network = NetworkManager.networks.find(
    (ntw) => ntw.name === network_name
  );

  console.clear();
  Header();

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message:
        `Selected network: ${network.name}` +
        `\n> RPC Url: ${
          network.url == ""
            ? chalk.red("*Empty...*")
            : chalk.yellow(network.url)
        }\n`,
      choices: [
        {
          name: chalk.yellowBright("Switch Network"),
          value: 0,
          disabled: "" === network.url,
        },
        { name: chalk.blueBright("Change RPC Url"), value: 1 },
        { name: chalk.blueBright("Change Name"), value: 2 },
        { name: chalk.red("Return Back"), value: 100 },
      ],
    },
  ]);

  switch (choice) {
    case 0:
      NetworkManager.switchNetwork(network.name);
      break;
    case 1:
      const { url } = await inquirer.prompt([
        {
          type: "input",
          name: "url",
          message: "Enter the RPC Url:",
        },
      ]);

      const { sure } = await inquirer.prompt([
        {
          type: "confirm",
          name: "sure",
          message: `Are you sure you want to change the RPC Url to "${url}"?`,
        },
      ]);

      if (!sure) break;

      console.log(NetworkManager.network.url);
      NetworkManager.changeRPCUrl(network.name, url);
      await ReturnMenu(`RPC Url changed to "${url}"`);

      break;
    case 2:
      const { name } = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: `Enter the new network name: (${network.name})`,
        },
      ]);

      const { sure2 } = await inquirer.prompt([
        {
          type: "confirm",
          name: "sure2",
          message: `Are you sure you want to change the network name to "${name}"?`,
        },
      ]);

      if (!sure2) break;

      NetworkManager.changeNetworkName(network.name, name);
      break;
    case 100:
      await SwitchNetworkMenu();
      break;
  }
}

export default NetworkMenu;
