import inquirer from "inquirer";
import chalk from "chalk";

import AuthManager from "../managers/AuthManager.js";
import ItuScanMenu from "./Components/dex_scan_menu.js";
import WalletMenu from "./Wallet_Menu/wallet_menu.js";
import PoolsMenu from "./Pool_Menu/pools_menu.js";
import ChooseWalletMenu from "./Wallet_Menu/choose_wallet_menu.js";
import SwitchNetworkMenu from "./Network_Menu/switch_network_menu.js";

import Header from "./Components/Header.js";
import WalletService from "../services/wallet_service.js";
import AddWalletMenu from "./Wallet_Menu/add_wallet_menu.js";

export default async function MainMenu() {
  console.clear();

  const choices = [
    {
      name: chalk.blue("Wallet"),
      value: 0,
      disabled: WalletService.getWallets().length !== 0,
    },
    { name: chalk.cyan("Pools"), value: 7 },
    // Probably not gonna implemented.
    //{ name: "ITUScan", value: 1, disabled: true },
  ];

  Header();

  if (AuthManager.isLoggedIn()) {
    choices.push({ name: "Disconnect", value: 2 });
  } else if (AuthManager.getWallets().length > 0) {
    choices.push({ name: "Choose Wallet", value: 3 });
  } else {
    choices.push({ name: "Initialize Wallet", value: 4 });
  }

  choices.push({
    name: chalk.green(`Switch to other networks.`),
    value: 5,
  });
  choices.push({ name: chalk.red("Exit (x)"), value: 6 });

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.yellow("Main Menu\n"),
      choices: choices
        .map((ch) => {
          ch.disabled = ch.disabled === false;
          return ch;
        })
        .sort((a, b) => {
          return (
            (a.disabled === false ? -1 : 1) - (b.disabled === false ? -1 : 1)
          );
        }),
    },
  ]);

  switch (choice) {
    // Wallet
    case 0:
      await WalletMenu();
      break;
    // ITUScan
    case 1:
      await ItuScanMenu();
      break;
    // Pools
    case 7:
      await PoolsMenu();
      break;
    case 3:
      await ChooseWalletMenu();
      break;
    case 4:
      await AddWalletMenu();
      break;
    case 2:
      await AuthManager.disconnect();
      break;
    case 5:
      await SwitchNetworkMenu();
      break;
    case 6:
      return console.log("Exiting...");
  }

  return await MainMenu();
}
