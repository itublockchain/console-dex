import AuthManager from "../../managers/AuthManager.js";
import { networks } from "../../utils/networks.js";

import inquirer from "inquirer";
import chalk from "chalk";
import MainMenu from "../main_menu.js";
import NetworkMenu from "./network_menu.js";

async function SwitchNetworkMenu() {
  const choices = [
    chalk.green("Add Network"),
    chalk.red("Return Back"),
    ...networks,
  ];

  console.log(
    chalk.gray(
      "----------------------------------------------------------------------------------------"
    )
  );

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.gray(
        "Network Menu, please select a network to configure or select network:"
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

      console.log(chalk.gray("Network added...", network));
      networks.push(network);
      await SwitchNetworkMenu();
      await MainMenu();
      break;
    case chalk.red("Return Back"):
      break;
    default:
      await NetworkMenu(choice);
  }
}

export default SwitchNetworkMenu;
