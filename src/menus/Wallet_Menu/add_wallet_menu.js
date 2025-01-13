import inquirer from "inquirer";
import chalk from "chalk";

import Header from "../Components/Header.js";
import AuthManager from "../../managers/AuthManager.js";

async function AddWalletMenu() {
  console.clear();

  Header();
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
    console.clear();

    Header();
    await inquirer.prompt([
      {
        type: "list",
        name: "ans",
        message: "Wrong private key!",
        choices: [{ name: chalk.red("Return Back"), value: "Return Back" }],
      },
    ]);
  }
}

export default AddWalletMenu;
