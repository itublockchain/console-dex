import inquirer from "inquirer";
import chalk from "chalk";
import Header from "../Components/Header.js";
import ListTokensMenu from "./list_tokens_menu.js";

async function TokenMenu(token) {
  console.clear();

  Header();

  console.log(chalk.green("Token Details:"));
  console.log(chalk.gray("Token:"), `${token.name}`);
  console.log(chalk.gray("Symbol:"), `${token.symbol}`);
  console.log(chalk.gray("Balance:"), `${Number(token.balance).toFixed(2)}$`);
  console.log(chalk.gray("Address:"), `${token.address}\n`);

  await inquirer.prompt([
    {
      type: "select",
      name: "selection",
      message: chalk.gray("..."),
      choices: ["Return Back"],
    },
  ]);

  return;
}

export default TokenMenu;
