import inquirer from "inquirer";
import chalk from "chalk";

import WalletService from "../../services/wallet_service.js";
import AuthManager from "../../managers/AuthManager.js";
import ListTokensMenu from "./list_tokens_menu.js";
import Header from "../Components/Header.js";
import ErrorHandler from "../../managers/ErrorHandler.js";

const MENU_ICONS = {
  ADD_WALLET: "➕",
  WALLET: "💼",
  TOKEN: "🪙",
  LIST: "📋",
  REMOVE: "❌",
  BACK: "←",
};

async function MyWalletMenu() {
  console.clear();
  Header();

  const wallets = await WalletService.getWallets();
  const currentWallet = AuthManager.current_wallet;

  console.log(chalk.blue.bold("\nWallet Information"));
  console.log(chalk.cyan("Total Wallets:"), chalk.white(wallets.length), "\n");

  const addWalletSection = [
    {
      name: `   ${chalk.greenBright("Add New Wallet")}`,
      value: "add_wallet",
    },
  ];

  const walletsSection = wallets.map((wallet) => {
    const isConnected = wallet.address === currentWallet;
    const prefix = isConnected ? ">" : "";
    return {
      name: `  ${chalk.cyan(prefix + " " + wallet.address)}${
        isConnected ? chalk.green(" (Connected)") : ""
      }`,
      value: `wallet_${wallet.address}`,
      short: wallet.address,
    };
  });

  const backSection = [
    {
      name: ` ${MENU_ICONS.BACK} ${chalk.red("Return Back")}`,
      value: "back",
    },
  ];

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.dim("Wallet Menu"),
      pageSize: 10,
      choices: [
        new inquirer.Separator(chalk.dim("═══ Management ═══")),
        ...addWalletSection,
        new inquirer.Separator(chalk.dim("═══ Your Wallets ═══")),
        ...walletsSection,
        new inquirer.Separator(chalk.dim("═══ Navigation ═══")),
        ...backSection,
      ],
    },
  ]);

  if (choice === "add_wallet") {
    await handleAddWallet();
    return await MyWalletMenu();
  } else if (choice === "back") {
    return;
  } else {
    const walletAddress = choice.replace("wallet_", "");
    await WalletOperationsMenu(walletAddress);
    return await MyWalletMenu();
  }
}

async function WalletOperationsMenu(walletAddress) {
  console.clear();
  Header();

  const isConnected = AuthManager.current_wallet === walletAddress;

  console.log(chalk.blue.bold("\n💼 Wallet Details"));
  console.log(chalk.cyan("Address:"), chalk.white(walletAddress));
  console.log(
    chalk.cyan("Status:"),
    isConnected ? chalk.green("Connected") : chalk.yellow("Not Connected")
  );

  const tokenSection = [
    {
      name: `  ${chalk.greenBright("Add Token")}`,
      value: "add_token",
      disabled: !isConnected ? chalk.dim("Connect wallet to add token") : false,
    },
    {
      name: `  ${chalk.cyan("List Tokens")}`,
      value: "list_tokens",
      disabled: !isConnected
        ? chalk.dim("Connect wallet to view tokens")
        : false,
    },
  ];

  const operationsSection = [
    {
      name: `  ${chalk.red("Remove Wallet")}`,
      value: "remove_wallet",
      disabled: !isConnected ? chalk.dim("Connect wallet to remove") : false,
    },
  ];

  const backSection = [
    {
      name: ` ${MENU_ICONS.BACK} ${chalk.red("Return Back")}`,
      value: "back",
    },
  ];

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.dim("(Use arrow keys)"),
      pageSize: 10,
      choices: [
        new inquirer.Separator(chalk.dim("═══ Token Operations ═══")),
        ...tokenSection,
        new inquirer.Separator(chalk.dim("═══ Wallet Operations ═══")),
        ...operationsSection,
        new inquirer.Separator(chalk.dim("═══ Navigation ═══")),
        ...backSection,
      ],
    },
  ]);

  switch (choice) {
    case "add_token":
      await handleAddToken();
      break;
    case "list_tokens":
      await ListTokensMenu();
      break;
    case "remove_wallet":
      const removed = await handleRemoveWallet(walletAddress);
      if (removed) return;
      break;
    case "back":
      return;
  }

  return await WalletOperationsMenu(walletAddress);
}

async function handleAddWallet() {
  const { private_key } = await inquirer.prompt([
    {
      type: "password",
      name: "private_key",
      message: "Enter Private Key:",
    },
  ]);

  const { wallet_password } = await inquirer.prompt([
    {
      type: "password",
      name: "wallet_password",
      message: "Enter Wallet Password:",
    },
  ]);

  try {
    const wallet = await WalletService.createWallet(
      private_key,
      wallet_password
    );
    console.log(chalk.green("\n✅ Wallet added successfully!"));
    console.log(chalk.cyan("Address:"), chalk.white(wallet.address));
  } catch (error) {
    if (error.message === "Wallet with this address already exists") {
      error.name = "PrivateKeyAlreadyExists";
      ErrorHandler.setError(error);
    } else {
      error.name = "WalletPrivateKeyError";
      ErrorHandler.setError(error);
    }
  }

  console.clear();
  Header();

  await inquirer.prompt([
    {
      type: "list",
      name: "continue",
      message: "Press enter to continue",
      choices: ["Continue"],
    },
  ]);
}

async function handleAddToken() {
  const { token_address } = await inquirer.prompt([
    {
      type: "input",
      name: "token_address",
      message: "Enter Token Address:",
    },
  ]);

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Are you sure you want to add this token?",
    },
  ]);

  if (!confirm) return false;

  try {
    await WalletService.addTokenAddress(token_address);
    console.log(chalk.green("\n✅ Token added successfully!"));
  } catch (error) {
    console.log(chalk.red("\n❌ Error adding token:", error.message));
  }

  await inquirer.prompt([
    {
      type: "list",
      name: "continue",
      message: "Press enter to continue",
      choices: ["Continue"],
    },
  ]);
  return false;
}

async function handleRemoveWallet(walletAddress) {
  console.log(chalk.yellow("\n⚠️  Warning: This action cannot be undone!"));
  console.log(chalk.cyan("Wallet to remove:"), chalk.white(walletAddress));

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Are you absolutely sure you want to remove this wallet?",
    },
  ]);

  if (!confirm) return false;

  try {
    if (AuthManager.current_wallet === walletAddress) {
      AuthManager.disconnect();
    }
    const result = await WalletService.removeWallet(walletAddress);

    if (result) {
      console.log(chalk.green("\n✅ Wallet removed successfully!"));
      return true;
    } else {
      console.log(chalk.red("\n❌ Failed to remove wallet"));
    }
  } catch (error) {
    console.log(chalk.red("\n❌ Error removing wallet:", error.message));
  }

  await inquirer.prompt([
    {
      type: "list",
      name: "continue",
      message: "Press enter to continue",
      choices: ["Continue"],
    },
  ]);
  return false;
}

export default MyWalletMenu;
