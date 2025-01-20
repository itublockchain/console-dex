import NetworkManager from "../../managers/NetworkManager.js";
import AuthManager from "../../managers/AuthManager.js";
import chalk from "chalk";
import ErrorHandler from "../../managers/ErrorHandler.js";

function Header() {
  // Get current network and wallet info
  const currentNetwork = NetworkManager.getCurrentNetwork();
  const capitalizedNetwork =
    currentNetwork.charAt(0).toUpperCase() + currentNetwork.slice(1);
  const currentWallet = AuthManager.isLoggedIn()
    ? AuthManager.getAddress().slice(0, 6) +
      "..." +
      AuthManager.getAddress().slice(-4)
    : AuthManager.getWallets().length > 0
    ? `Please choose a wallet (${AuthManager.getWallets().length} found)`
    : "Not Connected";

  // Display simplified header
  console.log(chalk.bold.cyan("\nCONSOLE-DEX: A LEGENDARY DEFI APPLICATION"));
  console.log(chalk.dim("─".repeat(30)));
  console.log(`${chalk.blue("•")} Network: ${chalk.cyan(capitalizedNetwork)}`);
  console.log(`${chalk.blue("•")} Wallet:  ${chalk.cyan(currentWallet)}`);
  if (!ErrorHandler.shadow) {
    console.log(
      chalk.red("\n•"),
      chalk.red("Error!"),
      chalk.yellow(`${ErrorHandler.error.name}:`),
      chalk.redBright(ErrorHandler.error.message)
    );
    ErrorHandler.deleteError();
  }
  console.log(chalk.dim("─".repeat(30)));
}

export default Header;
