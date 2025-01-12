import inquirer from "inquirer";
import chalk from "chalk";
import MainMenu from "../main_menu.js";
import NetworkMenu from "./network_menu.js";
import NetworkManager from "../../managers/NetworkManager.js";
import Header from "../Components/Header.js";

async function SwitchNetworkMenu() {
  const choices = [
    chalk.green("Add Network"),
    chalk.red("Return Back"),
    ...NetworkManager.networks.map(({ name }) => name),
  ];

  console.clear();
  Header();

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.gray(
        "Network Menu, please select a network to configure or select network:\n"
      ),
      choices,
    },
  ]);

  switch (choice) {
    case chalk.green("Add Network"):
      const { network } = await inquirer.prompt([
        {
          type: "input",
          name: "network",
          message: chalk.green("Enter the network name:"),
        },
      ]);

      console.log(chalk.gray("Network added..."), chalk.yellow(network));
      NetworkManager.networks.push({ name: network, url: "" });
      await SwitchNetworkMenu();
      break;
    case chalk.red("Return Back"):
      break;
    default:
      await NetworkMenu(choice);
  }
}

export default SwitchNetworkMenu;
