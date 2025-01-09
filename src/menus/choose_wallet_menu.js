import chalk from "chalk";
import inquirer from "inquirer";
import wrap from "../utils/wrap_async.js";

import AuthManager from "../managers/auth_manager.js";
import { AES256_decrypt } from "../utils/encryption_utils.js";

export default async function ChooseWalletMenu() {
  const wallets = AuthManager.getWallets();

  wallets
    .map((wallet, n) => `(${n + 1}) ${wallet.address}`)
    .forEach((wallet) => {
      console.log(wallet);
    });

  console.log(chalk.gray("Wallets: ..."));
  const { address_index } = await inquirer.prompt([
    {
      type: "input",
      name: "address_index",
      message: "Enter your wallet address:",
    },
  ]);

  console.log("Wallet selected, Please enter your wallet password to login.");

  const { wallet_password } = await inquirer.prompt([
    {
      type: "password",
      name: "wallet_password",
      message: "Enter your wallet password:",
    },
  ]);

  const [wallet, err] = await wrap(
    AuthManager.login(
      AES256_decrypt(
        wallets[address_index - 1].encrypted_private_key,
        wallet_password
      )
    )
  );

  if (err) return console.log(chalk.red("Wrong password!"));
}
