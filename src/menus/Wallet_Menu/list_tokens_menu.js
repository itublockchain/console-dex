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

  // Paralel olarak token bilgilerini çek
  tokens = await Promise.all(
    tokens.map((token) => WalletService.getERC20TokenBalance(token))
  );

  // Unknown tokenları filtrele
  let unknownTokens = tokens.filter(
    (tkn) => tkn.name === "Unknown Token" || tkn.state === false
  );
  // Bilinen tokenları filtrele
  tokens = tokens.filter(
    (tkn) => tkn.name !== "Unknown Token" && tkn.state !== false
  );

  // Eğer unknown token varsa, tek bir seçenek olarak en sona ekle
  if (unknownTokens.length > 0) {
    tokens.push({
      name: `Unknown Tokens (${unknownTokens.length})`,
      state: false,
      address: unknownTokens[0].address, // İlk unknown token'ın adresini kullan
    });
  }

  const choices_of_tokens = [
    { name: chalk.red("Return Back"), value: false },
    ...tokens.map((token) => {
      if (token.state === false) {
        return {
          name: `${chalk.yellow(token.name)}`,
          value: token.address,
          disabled: true,
        };
      }
      return {
        name: `${token.symbol} (${token.name}): ${Number(
          Number(token.balance) / 10 ** token.decimals
        ).toFixed(4)}`,
        value: token.address,
      };
    }),
  ];

  const { token_address } = await inquirer.prompt([
    {
      type: "list",
      name: "token_address",
      message: "Tokens:",
      choices: choices_of_tokens,
    },
  ]);

  if (token_address !== false)
    return await TokenMenu(
      tokens.find((token) => token.address === token_address)
    );
}

export default ListTokensMenu;
