import chalk from "chalk";
import inquirer from "inquirer";
import wrap from "../../utils/wrap_async.js";
import ReturnMenu from "../Components/return_menu.js";
import AuthManager from "../../managers/AuthManager.js";
import { AES256_decrypt } from "../../utils/encryption_utils.js";
import Header from "../Components/Header.js";

const MENU_ICONS = {
  BACK: "←",
};

export default async function ChooseWalletMenu() {
  console.clear();
  Header();

  const wallets = await AuthManager.getWallets();

  // Format wallet choices with icons and addresses
  const walletChoices = wallets.map((wallet, index) => ({
    name: `   ${chalk.cyan(wallet.address)}`,
    value: index + 1,
    short: `Wallet ${index + 1}`,
  }));

  // Add management options
  const managementChoices = [
    {
      name: ` ${MENU_ICONS.BACK} ${chalk.red("Return Back")}`,
      value: "BACK",
    },
  ];

  // Select wallet
  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.blue("\nSelect a wallet to connect:"),
      choices: [
        new inquirer.Separator(chalk.dim("\n ═══ Available Wallets ═══")),
        ...walletChoices,
        new inquirer.Separator(chalk.dim("═══ Management ═══")),
        ...managementChoices,
      ],
    },
  ]);

  if (choice === "BACK") return;

  // Get wallet password
  const { wallet_password } = await inquirer.prompt([
    {
      type: "password",
      name: "wallet_password",
      message: chalk.yellow("Enter your wallet password:"),
      validate: (input) => {
        if (!input.trim()) return "Password cannot be empty";
        return true;
      },
    },
  ]);

  // Confirm action
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: chalk.yellow("Do you want to connect this wallet?"),
      default: true,
    },
  ]);

  if (!confirm) return;

  // Try to login
  const [wallet, err] = await wrap(
    AuthManager.login(
      AES256_decrypt(
        wallets[choice - 1].encrypted_private_key,
        wallet_password
      ),
      wallet_password
    )
  );

  if (err) {
    console.log(chalk.red("✗ Wrong password!"));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return await ChooseWalletMenu();
  }

  console.log(chalk.green("✓ Successfully connected to wallet!"));
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return;
}
