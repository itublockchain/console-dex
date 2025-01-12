import WalletService from "../../services/wallet_service.js";
import inquirer from "inquirer";

import chalk from "chalk";
import TokenMenu from "./token_menu.js";
import WalletMenu from "./my_wallet_menu.js";

import Header from "../Components/Header.js";

async function ListTokensMenu() {
  console.clear();

  Header();

  let tokens = await WalletService.getTokenAddresses();

  for (let n in tokens) {
    tokens[n] = await WalletService.getERC20TokenBalance(tokens[n]);
  }

  tokens = tokens.sort((tkn) => tkn.state == false);

  let unknowns = tokens.filter((tkn) => tkn.state == false);
  if (unknowns.length > 0) {
    unknowns[0].name = `Not in this network (${unknowns.length} token${
      unknowns.length > 1 ? "s" : ""
    })`;

    tokens = tokens.filter((tkn) => tkn.state != false);
    tokens.push(unknowns[0]);
  }

  const choices_of_tokens = [
    { name: chalk.red("Return Back"), value: false },
    ...tokens.map((token) => {
      if (token.state == false)
        return {
          name: token.name,
          disabled: true,
        };
      return {
        name: `${token.symbol} (${token.name}): ${Number(
          Number(token.balance) / 10 ** token.decimals
        ).toFixed(2)}$`,
        value: token.address,
      };
    }),
  ];

  const { token_address } = await inquirer.prompt([
    {
      type: "select",
      name: "token_address",
      message: "Tokens:",
      choices: choices_of_tokens,
    },
  ]);

  if (token_address === false) return await WalletMenu();

  await TokenMenu(tokens.find((token) => token.address === token_address));
}

export default ListTokensMenu;
