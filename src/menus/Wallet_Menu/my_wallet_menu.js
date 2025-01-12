import inquirer from "inquirer";
import chalk from "chalk";

import WalletService from "../../services/wallet_service.js";
import AuthManager from "../../managers/AuthManager.js";

import ListTokensMenu from "./list_tokens_menu.js";
import Header from "../Components/Header.js";

async function MyWalletMenu(selected_address) {
  console.clear();
  Header();

  const disabled = AuthManager.current_wallet != selected_address;

  const choices = [
    { name: chalk.green("Add Token"), value: 0, disabled },
    { name: chalk.blueBright("List Tokens"), value: 1, disabled },
    { name: "Remove Wallet", value: 2, disabled },
    { name: chalk.redBright("Return Back"), value: 100 },
  ];
  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.yellow("My Wallet"),
      choices,
    },
  ]);

  switch (choice) {
    // Add Token
    case 0:
      const { token_address_input } = await inquirer.prompt([
        {
          type: "input",
          name: "token_address_input",
          message: "Token Address:",
        },
      ]);

      const { sure } = await inquirer.prompt([
        {
          type: "confirm",
          name: "sure",
          message: "Are you sure you want to add this token?",
        },
      ]);

      if (!sure) break;

      const result = await WalletService.addTokenAddress(token_address_input);

      switch (result) {
        // Remove Token.
        case "Token already exists.":
          console.log(chalk.red("Token already exists."));
          break;
        default:
          if (result?.state === false) {
            console.log(chalk.red("Token not found on network."));
            await inquirer.prompt([
              {
                type: "list",
                message:
                  "Token not found on network or wrong contract address.",
                choices: ["Return Back"],
              },
            ]);

            return await MyWalletMenu();
          }

          await inquirer.prompt([
            {
              type: "list",
              message: chalk.green(
                `Token ${result.symbol} (${result.name}) added successfully.`
              ),
              choices: ["Return Back"],
            },
          ]);

          return await MyWalletMenu();
      }

      break;
    // List Tokens
    case 1:
      await ListTokensMenu();
      break;
    // Return Back
    case 2:
      const { sure_2 } = await inquirer.prompt([
        {
          type: "confirm",
          name: "sure_2",
          message: "Are you sure you want to remove this wallet?",
        },
      ]);

      if (!sure_2) break;

      if (!disabled) AuthManager.disconnect();
      const result_2 = await WalletService.removeWallet(selected_address);

      if (!result_2)
        await inquirer.prompt([
          {
            type: "list",
            message: "Wallet not found.",
            choices: [chalk.red("Return Back")],
          },
        ]);

      return await MyWalletMenu();

    case 100:
      break;
  }
}

export default MyWalletMenu;
