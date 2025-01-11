import chalk from "chalk";
import inquirer from "inquirer";
import wrap from "../../utils/wrap_async.js";

import ReturnMenu from "../Components/return_menu.js";

import AuthManager from "../../managers/AuthManager.js";
import { AES256_decrypt } from "../../utils/encryption_utils.js";

export default async function ChooseWalletMenu() {
  const wallets = AuthManager.getWallets();

  console.log(chalk.gray("Wallets: ..."));
  wallets
    .map((wallet, n) => `(${n + 1}) ${wallet.address}`)
    .forEach((wallet) => {
      console.log(wallet);
    });

  const { address_index } = await inquirer.prompt([
    {
      type: "input",
      name: "address_index",
      message: "Enter the index of the wallet:",
    },
  ]);

  const { wallet_password, main_menu } = await inquirer.prompt([
    {
      type: "password",
      name: "wallet_password",
      message:
        chalk.yellow(`Wallet selected, `) +
        chalk.gray("please enter your wallet password to login.\n") +
        "Enter your wallet password:",
    },
    {
      type: "select",
      name: "main_menu",
      message:
        chalk.yellow("Are you sure?") +
        `\n-> ${chalk.green("[Yes]")} to login.` +
        `\n-> ${chalk.red("[No]")} to return to the main menu.\n`,
      choices: ["Yes", "No"],
    },
  ]);

  if (main_menu == "No") return;

  const [wallet, err] = await wrap(
    AuthManager.login(
      AES256_decrypt(
        wallets[address_index - 1].encrypted_private_key,
        wallet_password
      ),
      wallet_password
    )
  );

  if (err) return await ReturnMenu(chalk.red("Wrong password!"));
}
