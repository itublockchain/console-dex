import inquirer from "inquirer";
import chalk from "chalk";
import MainMenu from "../main_menu.js";
import NetworkMenu from "./network_menu.js";
import NetworkManager from "../../managers/NetworkManager.js";
import Header from "../Components/Header.js";

const NETWORK_ICONS = {
  CURRENT: "✓",
  BACK: "←",
};

async function SwitchNetworkMenu() {
  console.clear();
  await Header();

  // Get current network
  const currentNetwork = NetworkManager.getCurrentNetwork();

  // Create network choices with current network indicator
  const networkChoices = NetworkManager.networks.map(({ name }) => ({
    name: `${name === currentNetwork ? NETWORK_ICONS.CURRENT : " "} ${
      name === currentNetwork
        ? chalk.yellow(name.charAt(0).toUpperCase() + name.slice(1))
        : chalk.white(name.charAt(0).toUpperCase() + name.slice(1))
    }`,
    value: name,
    short: name,
  }));

  // Add management options
  const managementChoices = [
    {
      name: `  ${chalk.greenBright("Add New Network")}`,
      value: "ADD_NETWORK",
    },
    {
      name: chalk.red(`${NETWORK_ICONS.BACK} Return Back`),
      value: "BACK",
    },
  ];

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.blue("Select a network to connect:"),
      pageSize: 10,
      choices: [
        new inquirer.Separator(chalk.dim("═══ Available Networks ═══")),
        ...networkChoices,
        new inquirer.Separator(chalk.dim("═══ Management ═══")),
        ...managementChoices,
      ],
    },
  ]);

  switch (choice) {
    case "ADD_NETWORK":
      const { networkName, rpcUrl } = await inquirer.prompt([
        {
          type: "input",
          name: "networkName",
          message: chalk.green("Enter network name:"),
          validate: (input) => {
            if (!input.trim()) return "Network name cannot be empty";
            if (
              NetworkManager.networks.some(
                (n) => n.name.toLowerCase() === input.toLowerCase()
              )
            ) {
              return "Network already exists";
            }
            return true;
          },
        },
        {
          type: "input",
          name: "rpcUrl",
          message: chalk.green("Enter RPC URL:"),
          validate: (input) => {
            if (!input.trim()) return "RPC URL cannot be empty";
            try {
              new URL(input);
              return true;
            } catch {
              return "Please enter a valid URL";
            }
          },
        },
      ]);

      NetworkManager.networks.push({
        name: networkName.trim(),
        url: rpcUrl.trim(),
      });
      console.log(chalk.green("\n✓ Network added successfully!"));
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await SwitchNetworkMenu();

    case "BACK":
      return;

    default:
      await NetworkMenu(choice);
      return;
  }
}

export default SwitchNetworkMenu;
