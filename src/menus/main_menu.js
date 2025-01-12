import inquirer from "inquirer";
import chalk from "chalk";

import AuthManager from "../managers/AuthManager.js";
import ItuScanMenu from "./Components/dex_scan_menu.js";
import WalletMenu from "./Wallet_Menu/wallet_menu.js";
import PoolsMenu from "./Pool_Menu/pools_menu.js";
import ChooseWalletMenu from "./Wallet_Menu/choose_wallet_menu.js";
import SwitchNetworkMenu from "./Network_Menu/switch_network_menu.js";

import Header from "./Components/Header.js";

export default async function MainMenu() {
  console.clear();

  const choices = [
    "Pools",
    // To be implemented...
    { name: "My Balances", disabled: !AuthManager.isLoggedIn() },
    { name: "ITUScan", disabled: true },
  ];

  Header();

  if (AuthManager.isLoggedIn()) {
    choices.push("Disconnect");
  } else if (AuthManager.getWallets().length > 0) {
    choices.push("Choose Wallet");
  } else {
    choices.push("Initialize Wallet");
  }

  choices.push({
    name: chalk.green(`Switch to other networks.`),
    disabled: false,
  });
  choices.push(chalk.red("Exit (x)"));

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.yellow("Main Menu"),
      choices: choices,
    },
  ]);

  switch (choice) {
    case "My Balances":
      await WalletMenu(AuthManager.getCurrentWallet());
      break;
    case "ITUScan":
      await ItuScanMenu();
      break;
    case "Pools":
      await PoolsMenu();
      break;
    case "Choose Wallet":
      await ChooseWalletMenu();
      break;
    case "Initialize Wallet":
      const { private_key } = await inquirer.prompt([
        {
          type: "input",
          name: "private_key",
          message:
            "\nFirst of all, we need your private key." +
            "\nAfter that, with a wallet password, we will create your wallet." +
            "\nEnter your private key:",
        },
      ]);

      const { wallet_password } = await inquirer.prompt([
        {
          type: "input",
          name: "wallet_password",
          message: "Enter your wallet password:",
        },
      ]);

      try {
        await AuthManager.login(private_key, wallet_password);
      } catch (error) {
        await inquirer.prompt([
          {
            type: "list",
            name: "ans",
            message: "Wrong private key!",
            choices: [{ name: chalk.red("Return Back"), value: "Return Back" }],
          },
        ]);
      }
      break;
    case "Disconnect":
      await AuthManager.disconnect();
      break;
    case chalk.green(`Switch to other networks.`):
      await SwitchNetworkMenu();
      break;
    case chalk.red("Exit (x)"):
      return console.log("Exiting...");
  }

  return await MainMenu();
}
