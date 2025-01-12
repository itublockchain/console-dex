import inquirer from "inquirer";
import chalk from "chalk";

import WalletService from "../../services/wallet_service.js";
import MyWalletMenu from "./my_wallet_menu.js";

import AddWalletMenu from "./add_wallet_menu.js";
import Header from "../Components/Header.js";

async function WalletMenu() {
  const wallets = WalletService.getWallets();
  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.yellowBright("Wallet Menu"),
      choices: [
        { name: chalk.green("Add Wallet"), value: 0 },
        { name: chalk.redBright("Return Back"), value: 1 },
        ...wallets.map((wallet, n) => {
          return {
            name: chalk.blueBright(`(${n + 1}) ${wallet.address}`),
            value: wallet.address,
          };
        }),
      ],
    },
  ]);

  switch (choice) {
    case 0:
      return await AddWalletMenu();
    case 1:
      break;
  }

  if (wallets.map((w) => w.address).includes(choice)) {
    await MyWalletMenu(choice);
  }
}

export default WalletMenu;
