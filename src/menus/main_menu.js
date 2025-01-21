import inquirer from "inquirer";
import chalk from "chalk";

import AuthManager from "../managers/AuthManager.js";
import NetworkManager from "../managers/NetworkManager.js";

import PoolsMenu from "./Pool_Menu/pools_menu.js";
import MyWalletMenu from "./Wallet_Menu/my_wallet_menu.js";
import ChooseWalletMenu from "./Wallet_Menu/choose_wallet_menu.js";
import SwitchNetworkMenu from "./Network_Menu/switch_network_menu.js";

import Header from "./Components/Header.js";

const MENU_ICONS = {
  WALLET: "💼",
  POOLS: "🏊",
  NETWORK: "🌐",
  EXIT: "🚪",
  DISCONNECT: "🔌",
  CONNECT: "🔗",
};

export default async function MainMenu() {
  console.clear();

  // Get current network and wallet info
  const currentNetwork = NetworkManager.getCurrentNetwork();
  const capitalizedNetwork =
    currentNetwork.charAt(0).toUpperCase() + currentNetwork.slice(1);
  const currentWallet = AuthManager.isLoggedIn()
    ? AuthManager.getAddress().slice(0, 6) +
      "..." +
      AuthManager.getAddress().slice(-4)
    : "Not Connected";

  // Create sections for better organization
  const mainSection = [
    {
      name: `${MENU_ICONS.POOLS} ${chalk.cyan("Pools")} ${chalk.gray(
        "- Trade & Provide Liquidity"
      )}`,
      value: "POOLS",
    },
  ];

  const walletSection = [
    {
      name: `${MENU_ICONS.WALLET} ${chalk.blue("Wallets")}`,
      value: "WALLETS",
    },
  ];

  if (!AuthManager.isLoggedIn()) {
    walletSection.push({
      name: `${MENU_ICONS.CONNECT} ${chalk.blue("Connect Wallet")}`,
      value: "CONNECT_WALLET",
    });
  } else {
    walletSection.push({
      name: `${MENU_ICONS.DISCONNECT} ${chalk.yellow("Disconnect Wallet")}`,
      value: "DISCONNECT",
    });
  }

  const networkSection = [
    {
      name: `${MENU_ICONS.NETWORK} ${chalk.green("Switch Network")}`,
      value: "SWITCH_NETWORK",
    },
  ];

  const exitSection = [
    {
      name: `${MENU_ICONS.EXIT} ${chalk.red("Exit")}`,
      value: "EXIT",
    },
  ];

  // Display header
  await Header();

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "", // Removed message for cleaner look
      pageSize: 10,
      choices: [
        new inquirer.Separator(chalk.dim("═══ Main ═══")),
        ...mainSection,
        ...walletSection,
        ...networkSection,
        ...exitSection,
      ],
    },
  ]);

  switch (choice) {
    case "POOLS":
      await PoolsMenu();
      break;
    case "CONNECT_WALLET":
      await ChooseWalletMenu();
      break;
    case "INIT_WALLET":
      await AddWalletMenu();
      break;
    case "WALLETS":
      await MyWalletMenu();
      break;
    case "DISCONNECT":
      await AuthManager.disconnect();
      break;
    case "SWITCH_NETWORK":
      await SwitchNetworkMenu();
      break;
    case "EXIT":
      console.log(
        chalk.yellow("\nThank you for using Console DEX! Goodbye! 👋")
      );
      process.exit(0);
  }

  return await MainMenu();
}
