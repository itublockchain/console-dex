import inquirer from "inquirer";
import NetworkManager from "../../managers/NetworkManager.js";
import chalk from "chalk";
import SwitchNetworkMenu from "./switch_network_menu.js";
import Header from "../Components/Header.js";
import ReturnMenu from "../Components/return_menu.js";

const ICONS = {
  SWITCH: " ",
  SETTINGS: " ",
  URL: " ",
  RENAME: " ",
  BACK: "←",
};

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

async function NetworkMenu(network_name) {
  const network = NetworkManager.networks.find(
    (ntw) => ntw.name === network_name
  );

  if (!network) {
    console.log(chalk.red("\n✗ Error: Network not found"));
    await ReturnMenu();
    return;
  }

  console.clear();
  Header();

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.blue("Network Management Options:"),
      pageSize: 8,
      choices: [
        new inquirer.Separator(chalk.dim("═══ Actions ═══")),
        {
          name: `${ICONS.SWITCH} ${chalk.yellow("Switch to This Network")}`,
          value: 0,
          disabled: !network.url,
        },
        {
          name: `${ICONS.URL} ${chalk.green("Update RPC URL")}`,
          value: 1,
        },
        {
          name: `${ICONS.RENAME} ${chalk.white("Rename Network")}`,
          value: 2,
        },
        new inquirer.Separator(chalk.dim("═══ Navigation ═══")),
        {
          name: `${ICONS.BACK} ${chalk.red("Return to Network List")}`,
          value: 100,
        },
      ],
    },
  ]);

  switch (choice) {
    case 0:
      console.log(chalk.yellow("\nSwitching network..."));
      try {
        await NetworkManager.switchNetwork(network.name);
        console.log(
          chalk.green(`\nNetwork switched to "${network.name}" successfully!`)
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(
          chalk.red(`\n✗ Failed to switch network: ${error.message}`)
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      break;

    case 1:
      console.log(
        chalk.yellow("\nCurrent RPC URL:"),
        chalk.gray(network.url),
        "\n"
      );

      const { url } = await inquirer.prompt([
        {
          type: "input",
          name: "url",
          message: chalk.cyan("Enter the RPC URL:"),
          validate: (input) => {
            if (!input.trim()) return "URL cannot be empty";
            if (!isValidUrl(input)) return "Please enter a valid URL";
            return true;
          },
        },
      ]);

      const { sure } = await inquirer.prompt([
        {
          type: "confirm",
          name: "sure",
          message: chalk.yellow(
            `Confirm changing RPC URL to:\n${chalk.white(url)}`
          ),
          default: false,
        },
      ]);

      if (!sure) {
        console.log(chalk.yellow("\n⚠ Operation cancelled"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        break;
      }

      try {
        await NetworkManager.changeRPCUrl(network.name, url);
        console.log(
          chalk.green(`\n${network.name}: RPC URL updated successfully!`)
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(chalk.red(`\n✗ Error updating RPC URL: ${error.message}`));
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      break;

    case 2:
      const { name } = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: chalk.cyan("Enter new network name:"),
          default: network.name,
          validate: (input) => {
            if (!input.trim()) return "Name cannot be empty";
            if (
              NetworkManager.networks.some(
                (n) => n.name === input && n.name !== network.name
              )
            ) {
              return "A network with this name already exists";
            }
            return true;
          },
        },
      ]);

      const { sure2 } = await inquirer.prompt([
        {
          type: "confirm",
          name: "sure2",
          message: chalk.yellow(
            `Confirm renaming network to: ${chalk.white(name)}`
          ),
          default: false,
        },
      ]);

      if (!sure2) {
        console.log(chalk.yellow("\n⚠ Operation cancelled"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        break;
      }

      try {
        await NetworkManager.changeNetworkName(network.name, name);
        console.log(
          chalk.green(`\nNetwork renamed to "${network.name}" successfully!`)
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(chalk.red(`\n✗ Error renaming network: ${error.message}`));
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      break;

    case 100:
      await SwitchNetworkMenu();
      break;
  }
}

export default NetworkMenu;
