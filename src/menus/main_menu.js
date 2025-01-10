import inquirer from "inquirer";
import chalk from "chalk";

import AuthManager from "../managers/auth_manager.js";
import ItuScanMenu from "./Components/dex_scan_menu.js";
import WalletMenu from "./Wallet_Menu/wallet_menu.js";
import PoolsMenu from "./Pool_Menu/pools_menu.js";
import ChooseWalletMenu from "./Wallet_Menu/choose_wallet_menu.js";
import { networks } from "../utils/networks.js";

export default async function MainMenu() {
  console.clear();

  const isWalletConnected = AuthManager.isLoggedIn();
  const choices = [
    "Pools",
    // To be implemented...
    { name: "My Balances", disabled: true },
    { name: "ITUScan", disabled: true },
  ];

  console.log(
    chalk.gray(
      "----------------------------------------------------------------------------------------"
    )
  );

  console.log(chalk.blue.bold("CONSOLE-DEX: A Defi Application\n"));
  console.log("Network:", chalk.green(AuthManager.network.toUpperCase()));

  if (isWalletConnected) {
    console.log("Connected Wallet: " + AuthManager.getCurrentWallet());
    choices.push("Disconnect");
  } else if (AuthManager.getWallets().length > 0) {
    console.log(
      chalk.blueBright("Wallet: ") +
        "Please choose a wallet. " +
        chalk.yellow(`(${AuthManager.getWallets().length} wallets found)`)
    );
    choices.push("Choose Wallet");
  } else {
    console.log("Wallet: ", chalk.red("*Wallet not found!*"));
    choices.push("Initialize Wallet");
  }

  console.log(
    chalk.gray(
      "----------------------------------------------------------------------------------------"
    )
  );

  choices.push({
    name: chalk.green(`Switch to other network.`),
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

      await AuthManager.login(private_key, wallet_password);
      break;
    case "Disconnect":
      await AuthManager.disconnect();
      break;
    case chalk.green(`Switch to other network.`):
      AuthManager.network =
        networks[
          (networks.findIndex((network) => network == AuthManager.network) +
            1) %
            networks.length
        ];
      break;
    case chalk.red("Exit (x)"):
      return console.log("Exiting...");
  }

  return await MainMenu();
}
