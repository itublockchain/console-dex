import inquirer from "inquirer";
import WalletService from "../../services/wallet_service.js";
import chalk from "chalk";

async function WalletMenu(address) {
  const wallet = await WalletService.getWalletByAddress(address);

  // To be implemented...

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Wallet Menu",
      choices: [{ name: "Return Back" }],
    },
  ]);
}

export default WalletMenu;
