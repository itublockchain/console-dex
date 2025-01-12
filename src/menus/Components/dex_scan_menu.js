import inquirer from "inquirer";
import WalletMenu from "../Wallet_Menu/my_wallet_menu.js";
import walletService from "../../services/wallet_service.js";

async function DexScanMenu() {
  const wallets = await walletService.getWallets();
  const addresses = wallets.map((wallet) => wallet.address);

  const { address } = await inquirer.prompt([
    {
      type: "list",
      name: "address",
      message: "Wallets",
      choices: [...addresses, "Return Back"],
    },
  ]);

  if (!addresses.includes(address)) return;

  await WalletMenu(address);
  await DexScanMenu();
}

export default DexScanMenu;
