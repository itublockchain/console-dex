import inquirer from "inquirer";
import NetworkManager from "../../managers/NetworkManager.js";

async function NetworkMenu(network) {
  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: `Selected network: ${network}`,
      choices: [
        "Switch Network",
        "Change RPC Url",
        "Change Name",
        "Return Back",
      ],
    },
  ]);

  switch (choice) {
    case "Switch Network":
      NetworkManager.switchNetwork(network);
      break;
    case "Change RPC Url":
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

      NetworkManager.changeRPCUrl(url);
      break;
    case "Change Name":
      const { name } = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: `Enter the new network name: (${network})`,
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

      NetworkManager.changeNetworkName(network, name);
      break;
    case "Return Back":
      break;
  }
}

export default NetworkMenu;
