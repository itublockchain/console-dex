import NetworkManager from "../../managers/NetworkManager.js";
import AuthManager from "../../managers/AuthManager.js";

import chalk from "chalk";

function Header() {
  console.log(
    chalk.gray(
      "----------------------------------------------------------------------------------------"
    )
  );

  console.log(chalk.blue.bold("CONSOLE-DEX: A Defi Application\n"));
  console.log(
    "Network:",
    chalk.green(NetworkManager.network.name.toUpperCase())
  );

  if (AuthManager.isLoggedIn()) {
    console.log("Connected Wallet: " + AuthManager.getCurrentWallet());
  } else if (AuthManager.getWallets().length > 0) {
    console.log(
      chalk.blueBright("Wallet: ") +
        "Please choose a wallet. " +
        chalk.yellow(`(${AuthManager.getWallets().length} wallets found)`)
    );
  } else {
    console.log("Wallet: ", chalk.red("*Wallet not found!*"));
  }

  console.log(
    chalk.gray(
      "----------------------------------------------------------------------------------------"
    )
  );
}

export default Header;
