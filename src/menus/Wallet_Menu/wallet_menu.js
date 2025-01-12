import inquirer from "inquirer";
import WalletService from "../../services/wallet_service.js";
import chalk from "chalk";

import ListTokensMenu from "./list_tokens_menu.js";
import Header from "../Components/Header.js";

async function WalletMenu() {
  console.clear();
  Header();

  const choices = [
    { name: chalk.green("Add Token"), value: 0 },
    { name: "List Tokens", value: 1 },
    { name: chalk.redBright("Return Back"), value: 2 },
  ];
  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Balances:",
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

            return await WalletMenu();
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

          return await WalletMenu();
      }

      break;
    // List Tokens
    case 1:
      await ListTokensMenu();
      break;
    // Return Back
    case 2:
      break;
  }
}

export default WalletMenu;
