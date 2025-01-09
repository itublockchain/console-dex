import inquirer from "inquirer";
import chalk from "chalk";

import AuthManager from "../managers/auth_manager.js";
import ItuScanMenu from "./ituscan_menu.js";
import WalletMenu from "./wallet_menu.js";
import PoolsMenu from "./pools_menu.js";
import ChooseWalletMenu from "./choose_wallet_menu.js";

export default async function MainMenu() {
  const isWalletConnected = AuthManager.isLoggedIn();
  const choices = [
    { name: "My Balances", disabled: !isWalletConnected },
    "ITUScan",
    "Pools",
  ];

  if (isWalletConnected) {
    console.log("\nConnected Wallet: " + AuthManager.getCurrentWallet());
    choices.push("Disconnect");
  } else if (AuthManager.getWallets().length > 0) {
    console.log(
      `No wallet connected, Please choose a wallet (${
        AuthManager.getWallets().length
      })`
    );
    choices.push("Choose Wallet");
  } else {
    console.log("Wallet not connected");
    choices.push("Initialize Wallet");
  }

  console.log(
    chalk.gray(
      "----------------------------------------------------------------------------------------"
    )
  );

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Main Menu",
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
      return await AuthManager.disconnect();
  }

  return await MainMenu();
}
